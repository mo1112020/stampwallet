-- Paddle billing — replaces the Stripe integration, which was fully built
-- but never activated (no API keys ever configured, locally or in
-- production, so stripe_customer_id/stripe_subscription_item_id are
-- guaranteed null on every existing row — safe to drop outright).

-- 1. Merchant subscription state ---------------------------------------------

alter table public.merchants
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_item_id;

alter table public.merchants
  add column if not exists paddle_customer_id text,
  add column if not exists paddle_subscription_id text,
  add column if not exists paddle_price_id text,
  add column if not exists plan_interval text check (plan_interval in ('monthly', 'quarterly', 'yearly')),
  add column if not exists subscription_status text check (subscription_status in ('active', 'trialing', 'past_due', 'paused', 'canceled')),
  -- The actual "expiration"/renewal date: when the CURRENT paid period ends
  -- and either renews (status active) or access actually stops (status
  -- canceled, or past_due after Paddle's dunning retries are exhausted).
  -- Null for merchants who've never subscribed (plan = 'free').
  add column if not exists current_period_ends_at timestamptz,
  -- Set only when a cancellation is scheduled but not yet effective —
  -- Paddle keeps a subscription (and therefore paid access) running until
  -- this date even after the merchant has clicked "cancel" from the portal.
  -- Null the rest of the time, including once the cancellation actually
  -- takes effect (subscription_status flips to 'canceled' and this clears).
  add column if not exists scheduled_cancel_at timestamptz;

create index if not exists merchants_paddle_customer_id_idx on public.merchants(paddle_customer_id);
create index if not exists merchants_paddle_subscription_id_idx on public.merchants(paddle_subscription_id);

-- 2. Raw webhook event log ---------------------------------------------------
-- Two jobs: idempotency (Paddle can and does deliver the same webhook more
-- than once — check event_id here before applying it twice) and support/
-- debugging (see exactly what Paddle sent for a merchant's billing history
-- without needing separate access to the Paddle dashboard itself).

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paddle',
  event_id text not null,
  event_type text not null,
  merchant_id uuid references public.merchants(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index billing_events_merchant_id_idx on public.billing_events(merchant_id);

alter table public.billing_events enable row level security;

-- Service role only, deliberately no policies — this is an internal audit
-- trail, not merchant-facing data. Same pattern as
-- apple_device_registrations (see 003_apple_wallet_devices.sql).
