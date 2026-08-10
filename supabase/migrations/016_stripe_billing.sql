-- Stripe billing — replaces the Paddle integration. Paddle was sandbox-only
-- (no production customers ever subscribed through it), so its IDs are
-- dropped outright rather than migrated. plan_interval, subscription_status,
-- current_period_ends_at, scheduled_cancel_at, and billing_events are all
-- provider-agnostic already and are reused as-is (see 015_paddle_billing.sql).

alter table public.merchants
  drop column if exists paddle_customer_id,
  drop column if exists paddle_subscription_id,
  drop column if exists paddle_price_id;

alter table public.merchants
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text;

create index if not exists merchants_stripe_customer_id_idx on public.merchants(stripe_customer_id);
create index if not exists merchants_stripe_subscription_id_idx on public.merchants(stripe_subscription_id);
