-- Phase 8: wallet-native notification system. No email/SMS/separate
-- customer app — delivery is entirely through updating the customer's
-- Apple/Google Wallet pass (Apple changeMessage + APNs wake, Google
-- Wallet messages array), reusing the existing lib/wallet/* pipeline.
-- Fully buildable without live Wallet credentials since that pipeline
-- already gates real sends behind isAppleWalletConfigured()/
-- isGoogleWalletConfigured() and no-ops gracefully otherwise.

alter table public.customers
  add column if not exists birthday date;

-- Persists the current notification text embedded on the pass (Apple: a
-- back-of-card field with changeMessage: "%@" — the OS shows this as the
-- lock-screen notification the moment the field's value changes and the
-- device re-fetches; Google: appended to the loyalty object's messages
-- array on patch). Read by lib/wallet/apple.ts / google.ts whenever a pass
-- is (re)generated, so the message survives beyond the single push event.
alter table public.customer_progress
  add column if not exists latest_notification_message text;

create table public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  type text not null check (type in ('manual', 'scheduled', 'automated')),
  trigger text check (trigger in ('reward_unlocked', 'birthday', 'expiring_reward', 'inactive_customer')),
  program_id uuid references public.loyalty_programs(id) on delete cascade,
  segment jsonb not null default '{}'::jsonb,
  title text not null,
  message text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'canceled')),
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automated_needs_trigger check (type != 'automated' or trigger is not null)
);

create index notification_campaigns_merchant_id_idx on public.notification_campaigns(merchant_id);

create trigger notification_campaigns_set_updated_at
before update on public.notification_campaigns
for each row execute function public.set_updated_at();

create table public.notification_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.notification_campaigns(id) on delete cascade,
  customer_progress_id uuid not null references public.customer_progress(id) on delete cascade,
  platform text not null check (platform in ('apple', 'google', 'both')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'stubbed')),
  message text not null,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, customer_progress_id)
);

create index notification_sends_campaign_id_idx on public.notification_sends(campaign_id);
create index notification_sends_customer_progress_id_idx on public.notification_sends(customer_progress_id);

create trigger notification_sends_set_updated_at
before update on public.notification_sends
for each row execute function public.set_updated_at();

alter table public.notification_campaigns enable row level security;
alter table public.notification_sends enable row level security;

create policy "merchants and staff access notification_campaigns"
on public.notification_campaigns for all
using (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id))
with check (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id));

create policy "merchants and staff access notification_sends"
on public.notification_sends for all
using (
  exists (
    select 1 from public.notification_campaigns c
    where c.id = notification_sends.campaign_id
      and (c.merchant_id = auth.uid() or public.is_active_staff_of(c.merchant_id))
  )
)
with check (
  exists (
    select 1 from public.notification_campaigns c
    where c.id = notification_sends.campaign_id
      and (c.merchant_id = auth.uid() or public.is_active_staff_of(c.merchant_id))
  )
);
