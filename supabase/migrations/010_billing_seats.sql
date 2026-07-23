-- Phase 7: track the Stripe subscription item backing seat-based billing,
-- so quantity can be updated (via stripe.subscriptionItems.update) whenever
-- staff are invited/revoked, without re-listing subscriptions each time.

alter table public.merchants
  add column if not exists stripe_subscription_item_id text;
