-- Phase 2: Staff accounts, roles & permissions.
--
-- Today merchants.id = auth.users.id, a strict 1:1 "owner" identity. This
-- migration adds staff who act on behalf of a merchant (their own Supabase
-- Auth login, invited via admin.inviteUserByEmail) with one of three roles.
-- The owner stays implicit (no staff_accounts row) — only non-owner staff
-- are represented here. Fine-grained "who can do what" (capabilities) is
-- enforced in application code (lib/auth/permissions.ts); RLS here only
-- controls row *visibility* — can this session see this merchant's data at
-- all.

create table public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  role text not null check (role in ('admin', 'manager', 'staff')),
  status text not null default 'invited' check (status in ('invited', 'active', 'revoked')),
  invited_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index staff_accounts_merchant_id_idx on public.staff_accounts(merchant_id);

create trigger staff_accounts_set_updated_at
before update on public.staff_accounts
for each row execute function public.set_updated_at();

alter table public.staff_accounts enable row level security;

-- SECURITY DEFINER so these can be referenced from other tables' RLS
-- policies without re-triggering RLS recursively on staff_accounts itself
-- (a common footgun with self-referential membership checks).

create or replace function public.is_active_staff_of(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_accounts
    where user_id = auth.uid()
      and merchant_id = p_merchant_id
      and status = 'active'
  );
$$;

create or replace function public.can_manage_staff(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_merchant_id = auth.uid()
     or exists (
       select 1 from public.staff_accounts
       where user_id = auth.uid()
         and merchant_id = p_merchant_id
         and status = 'active'
         and role = 'admin'
     );
$$;

create policy "owner and admins manage staff accounts"
on public.staff_accounts for all
using (public.can_manage_staff(merchant_id))
with check (public.can_manage_staff(merchant_id));

create policy "staff read own row"
on public.staff_accounts for select
using (user_id = auth.uid());

-- Extend existing tenant-scoped policies to also allow active staff of
-- that merchant, not just the owner. Column-level restriction isn't
-- possible with RLS (row-level only), so staff can read the full
-- merchants row for their employer — acceptable, nothing there is a
-- secret (stripe_customer_id is an opaque reference id, not a key).

drop policy "merchants access own row" on public.merchants;
create policy "merchants access own row"
on public.merchants for all
using (id = auth.uid())
with check (id = auth.uid());

create policy "staff read own merchant"
on public.merchants for select
using (public.is_active_staff_of(id));

drop policy "merchants access own programs" on public.loyalty_programs;
create policy "merchants and staff access programs"
on public.loyalty_programs for all
using (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id))
with check (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id));

drop policy "merchants access own customers" on public.customers;
create policy "merchants and staff access customers"
on public.customers for all
using (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id))
with check (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id));

drop policy "merchants access own customer_progress" on public.customer_progress;
create policy "merchants and staff access customer_progress"
on public.customer_progress for all
using (
  exists (
    select 1 from public.loyalty_programs p
    where p.id = customer_progress.program_id
      and (p.merchant_id = auth.uid() or public.is_active_staff_of(p.merchant_id))
  )
)
with check (
  exists (
    select 1 from public.loyalty_programs p
    where p.id = customer_progress.program_id
      and (p.merchant_id = auth.uid() or public.is_active_staff_of(p.merchant_id))
  )
);

-- scan_events was previously "scanned_by = auth.uid()", which only worked
-- by coincidence (only merchants could scan, so scanned_by was always the
-- viewer's own id). Once staff can scan, scanned_by is the staff member's
-- id, so a viewing owner needs to see rows they didn't personally create —
-- this fixes visibility to be based on merchant/tenant, not literal scanner
-- identity, while still requiring scanned_by to be yourself on write.
drop policy "merchants access own scan_events" on public.scan_events;
create policy "merchants and staff access scan_events"
on public.scan_events for select
using (
  exists (
    select 1 from public.customer_progress cp
    join public.loyalty_programs p on p.id = cp.program_id
    where cp.id = scan_events.customer_progress_id
      and (p.merchant_id = auth.uid() or public.is_active_staff_of(p.merchant_id))
  )
);
create policy "merchants and staff write own scan_events"
on public.scan_events for insert
with check (
  scanned_by = auth.uid()
  and exists (
    select 1 from public.customer_progress cp
    join public.loyalty_programs p on p.id = cp.program_id
    where cp.id = scan_events.customer_progress_id
      and (p.merchant_id = auth.uid() or public.is_active_staff_of(p.merchant_id))
  )
);

drop policy "merchants access own redemptions" on public.redemptions;
create policy "merchants and staff access redemptions"
on public.redemptions for all
using (
  exists (
    select 1
    from public.customer_progress cp
    join public.loyalty_programs p on p.id = cp.program_id
    where cp.id = redemptions.customer_progress_id
      and (p.merchant_id = auth.uid() or public.is_active_staff_of(p.merchant_id))
  )
)
with check (
  exists (
    select 1
    from public.customer_progress cp
    join public.loyalty_programs p on p.id = cp.program_id
    where cp.id = redemptions.customer_progress_id
      and (p.merchant_id = auth.uid() or public.is_active_staff_of(p.merchant_id))
  )
);
