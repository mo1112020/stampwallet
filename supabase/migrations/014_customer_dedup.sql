-- Prevent duplicate customer enrollment.
--
-- Previously /api/customers/enroll always inserted a brand-new `customers`
-- row on every submit, so a customer re-scanning the same join QR code (or
-- double-submitting the join form) ended up with N separate customer
-- records instead of one. customer_progress already had a unique
-- (customer_id, program_id) constraint, but it never engaged because the
-- customer_id was different every time.
--
-- This migration:
--   1. Merges any duplicate customer rows that already exist (same
--      merchant + phone/email), preserving whichever wallet pass is
--      actually installed on a device and folding scan/redemption history
--      together, so no activity is lost.
--   2. Adds partial unique indexes so duplicates can't be created again,
--      even under concurrent requests.
--   3. Adds an atomic find-or-create RPC so the app never has to do a
--      racy check-then-insert from JS.

-- 1. Merge existing duplicates ----------------------------------------------

create or replace function public._merge_customer_into(p_loser_id uuid, p_survivor_id uuid)
returns void
language plpgsql
as $$
declare
  loser_cp public.customer_progress%rowtype;
  survivor_cp public.customer_progress%rowtype;
  keep_loser boolean;
begin
  if p_loser_id = p_survivor_id then
    return;
  end if;

  for loser_cp in
    select * from public.customer_progress where customer_id = p_loser_id
  loop
    select * into survivor_cp
    from public.customer_progress
    where customer_id = p_survivor_id and program_id = loser_cp.program_id;

    if not found then
      -- Survivor has no progress in this program yet — just move the row over.
      update public.customer_progress
      set customer_id = p_survivor_id
      where id = loser_cp.id;
      continue;
    end if;

    -- Both customer records have progress in the same program (the
    -- duplicate-enrollment bug). Keep whichever row has an actual wallet
    -- pass installed (a real device push token) so we don't silently break
    -- someone's already-added pass; if both/neither do, keep the more
    -- recently updated one. Fold the other's activity history in before
    -- dropping it.
    if (survivor_cp.apple_push_token is null and survivor_cp.google_object_id is null)
       and (loser_cp.apple_push_token is not null or loser_cp.google_object_id is not null) then
      keep_loser := true;
    elsif (loser_cp.apple_push_token is null and loser_cp.google_object_id is null)
       and (survivor_cp.apple_push_token is not null or survivor_cp.google_object_id is not null) then
      keep_loser := false;
    else
      keep_loser := loser_cp.updated_at > survivor_cp.updated_at;
    end if;

    if keep_loser then
      update public.scan_events set customer_progress_id = loser_cp.id where customer_progress_id = survivor_cp.id;
      update public.redemptions set customer_progress_id = loser_cp.id where customer_progress_id = survivor_cp.id;
      delete from public.customer_progress where id = survivor_cp.id;
      update public.customer_progress set customer_id = p_survivor_id where id = loser_cp.id;
    else
      update public.scan_events set customer_progress_id = survivor_cp.id where customer_progress_id = loser_cp.id;
      update public.redemptions set customer_progress_id = survivor_cp.id where customer_progress_id = loser_cp.id;
      delete from public.customer_progress where id = loser_cp.id;
    end if;
  end loop;

  -- Backfill any contact info the survivor is missing from the loser
  -- before deleting it, so we don't drop data on merge.
  update public.customers s
  set
    name = coalesce(nullif(trim(coalesce(s.name, '')), ''), l.name),
    phone = coalesce(s.phone, l.phone),
    email = coalesce(s.email, l.email),
    birthday = coalesce(s.birthday, l.birthday)
  from public.customers l
  where s.id = p_survivor_id and l.id = p_loser_id;

  delete from public.customers where id = p_loser_id;
end;
$$;

do $$
declare
  grp record;
  survivor_id uuid;
  loser_id uuid;
begin
  for grp in
    select merchant_id, phone
    from public.customers
    where phone is not null
    group by merchant_id, phone
    having count(*) > 1
  loop
    select id into survivor_id
    from public.customers
    where merchant_id = grp.merchant_id and phone = grp.phone
    order by created_at asc, id asc
    limit 1;

    for loser_id in
      select id from public.customers
      where merchant_id = grp.merchant_id and phone = grp.phone and id <> survivor_id
    loop
      perform public._merge_customer_into(loser_id, survivor_id);
    end loop;
  end loop;

  for grp in
    select merchant_id, lower(email) as email_lc
    from public.customers
    where email is not null
    group by merchant_id, lower(email)
    having count(*) > 1
  loop
    select id into survivor_id
    from public.customers
    where merchant_id = grp.merchant_id and lower(email) = grp.email_lc
    order by created_at asc, id asc
    limit 1;

    for loser_id in
      select id from public.customers
      where merchant_id = grp.merchant_id and lower(email) = grp.email_lc and id <> survivor_id
    loop
      perform public._merge_customer_into(loser_id, survivor_id);
    end loop;
  end loop;
end $$;

drop function public._merge_customer_into(uuid, uuid);

-- 2. Lock the identity uniqueness in --------------------------------------

create unique index if not exists customers_merchant_phone_uidx
  on public.customers (merchant_id, phone)
  where phone is not null;

create unique index if not exists customers_merchant_email_uidx
  on public.customers (merchant_id, lower(email))
  where email is not null;

-- 3. Atomic find-or-create enrollment RPC ----------------------------------

create or replace function public.enroll_customer(
  p_merchant_id uuid,
  p_program_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_progress jsonb
)
returns table (
  customer_id uuid,
  progress_id uuid,
  pass_id uuid,
  apple_auth_token text,
  google_auth_token text,
  progress jsonb,
  enrolled_at timestamptz,
  is_new_enrollment boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_cp public.customer_progress%rowtype;
  v_new_progress boolean := false;
begin
  select id into v_customer_id
  from public.customers
  where merchant_id = p_merchant_id
    and (
      (p_phone is not null and phone = p_phone)
      or (p_email is not null and lower(email) = lower(p_email))
    )
  order by created_at asc
  limit 1;

  if v_customer_id is null then
    begin
      insert into public.customers (merchant_id, name, phone, email)
      values (p_merchant_id, p_name, p_phone, p_email)
      returning id into v_customer_id;
    exception when unique_violation then
      -- Lost a race to a concurrent enrollment with the same phone/email —
      -- the winner's row is now visible, use it.
      select id into v_customer_id
      from public.customers
      where merchant_id = p_merchant_id
        and (
          (p_phone is not null and phone = p_phone)
          or (p_email is not null and lower(email) = lower(p_email))
        )
      order by created_at asc
      limit 1;
    end;
  elsif p_name is not null and length(trim(p_name)) > 0 then
    update public.customers
    set name = p_name
    where id = v_customer_id and (name is null or length(trim(name)) = 0);
  end if;

  select * into v_cp
  from public.customer_progress cp
  where cp.customer_id = v_customer_id and cp.program_id = p_program_id;

  if not found then
    begin
      insert into public.customer_progress (customer_id, program_id, progress)
      values (v_customer_id, p_program_id, p_progress)
      returning * into v_cp;
      v_new_progress := true;
    exception when unique_violation then
      select * into v_cp
      from public.customer_progress cp
      where cp.customer_id = v_customer_id and cp.program_id = p_program_id;
    end;
  end if;

  return query select
    v_customer_id,
    v_cp.id,
    v_cp.pass_id,
    v_cp.apple_auth_token,
    v_cp.google_auth_token,
    v_cp.progress,
    v_cp.created_at,
    v_new_progress;
end;
$$;
