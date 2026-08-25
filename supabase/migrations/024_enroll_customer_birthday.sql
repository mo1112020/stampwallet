-- Let the public join page optionally collect a customer's birthday at
-- enrollment time.
--
-- customers.birthday already exists (see 001_initial_schema.sql) and already
-- powers the "birthday_month" notification segment (lib/notifications/segments.ts)
-- and dashboard filter (lib/customers/queries.ts) -- but nothing ever wrote to
-- it, because the enroll_customer() RPC (014_customer_dedup.sql) had no
-- birthday parameter and the join page never asked for one. This migration
-- is the missing write path; the merchant-facing per-program toggle
-- (config.enrollment_page.collect_birthday, a JSONB field on
-- loyalty_programs -- no migration needed for that half) decides whether the
-- join page shows the field at all.
--
-- enroll_customer()'s argument list is changing (a new p_birthday
-- parameter), not just its body, so `create or replace function` would
-- create a second, overloaded version instead of replacing the existing one
-- -- Postgres only lets CREATE OR REPLACE reuse the same name when the
-- argument *types* also match. Drop the old 6-arg signature first so only
-- one version of enroll_customer ever exists (avoids PostgREST/RPC "could
-- not choose the best candidate function" ambiguity when called by name).

drop function if exists public.enroll_customer(uuid, uuid, text, text, text, jsonb);

create function public.enroll_customer(
  p_merchant_id uuid,
  p_program_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_progress jsonb,
  p_birthday date default null
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
      insert into public.customers (merchant_id, name, phone, email, birthday)
      values (p_merchant_id, p_name, p_phone, p_email, p_birthday)
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

  -- Backfills/updates the birthday for a *returning* customer whose row
  -- already existed (a fresh insert above already carries p_birthday). Only
  -- runs when a birthday was actually submitted this time — a re-enrollment
  -- on a program that doesn't collect birthday sends p_birthday = null and
  -- must never null out a birthday collected earlier on another program.
  if p_birthday is not null then
    update public.customers
    set birthday = p_birthday
    where id = v_customer_id;
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
