-- Retroactive billing enforcement.
--
-- Until now, downgrading/canceling only ever blocked *new* writes over the
-- new plan's limits (program creation, enrollment, staff invites, locations
-- — see app/api/programs/route.ts etc.) and disabled card-expiration
-- (disableCardExpirationForMerchant). Everything the merchant already had —
-- extra programs, locations, staff seats, and live wallet-pass updates to
-- every enrolled customer — kept working forever regardless of billing
-- state. This migration adds the state lib/billing/enforcement.ts needs to
-- actually restrict an account down to its current plan once it's been
-- unpaid long enough, and to cleanly restore everything on resubscribe.
--
-- Sequence: hasActiveAccess() flips false (webhook) -> billing_grace_ends_at
-- set, warning email sent -> after the grace window, a daily cron sweep
-- calls enforceBillingLimits() once (billing_enforced_at marks that it
-- already ran) -> if the merchant resubscribes at any point,
-- restoreBillingLimits() clears all of this and reactivates everything it
-- had turned off.

alter table public.merchants
  add column if not exists billing_grace_ends_at timestamptz,
  add column if not exists billing_enforced_at timestamptz;

comment on column public.merchants.billing_grace_ends_at is
  'Set the moment paid access ends (see lib/billing/access.ts hasActiveAccess). Cleared on resubscribe. Enforcement runs once this passes and has not yet run (billing_enforced_at is null), via the daily cron sweep.';
comment on column public.merchants.billing_enforced_at is
  'Set once enforcement has actually run for the current lapse, so the cron sweep does not repeat it. Cleared on resubscribe.';

alter table public.loyalty_programs
  add column if not exists deactivated_by_billing boolean not null default false;
alter table public.store_locations
  add column if not exists deactivated_by_billing boolean not null default false;
alter table public.staff_accounts
  add column if not exists suspended_by_billing boolean not null default false;

comment on column public.loyalty_programs.deactivated_by_billing is
  'True when is_active was flipped false by enforceBillingLimits(), not by the merchant themselves — lets restoreBillingLimits() reactivate exactly (and only) what it turned off, without touching a program the merchant had already archived on purpose.';
comment on column public.store_locations.deactivated_by_billing is
  'Same as loyalty_programs.deactivated_by_billing, for store_locations.';
comment on column public.staff_accounts.suspended_by_billing is
  'Independent of status (invited/active/revoked) — a billing suspension is meant to be temporary and auto-reversed on resubscribe, unlike an owner-issued revoke.';

-- is_active_staff_of() gates nearly every tenant table''s RLS (see
-- 005_staff_accounts.sql) — layering the billing-suspension check in here
-- means every one of those policies picks it up automatically, the same
-- reasoning that function existed for in the first place.
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
      and suspended_by_billing = false
  );
$$;

-- Two new automated-notification triggers for the wallet-pass side of
-- enforcement/restoration (see lib/notifications/campaigns.ts's existing
-- triggerAutomatedNotification, reused as-is — this only widens what
-- `trigger` is allowed to be).
alter table public.notification_campaigns
  drop constraint if exists notification_campaigns_trigger_check;
alter table public.notification_campaigns
  add constraint notification_campaigns_trigger_check
  check (trigger in ('reward_unlocked', 'birthday', 'expiring_reward', 'inactive_customer', 'billing_paused', 'billing_restored'));
