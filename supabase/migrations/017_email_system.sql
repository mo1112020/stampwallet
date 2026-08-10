-- Email notification system (Resend). Reuses the same insert-first,
-- unique-key idempotency pattern already used by billing_events
-- (015_paddle_billing.sql) and notification_sends (011_notifications.sql) —
-- one proven mechanism, not a new one.

-- 1. Email preferences ---------------------------------------------------
-- Deliberately NOT reusing merchants.notification_prefs — that column is
-- wallet-push preferences (Apple/Google pass update notifications, see
-- 011_notifications.sql), a different channel/concern entirely. This
-- mirrors its shape (a small jsonb toggle bag) for the email channel.
-- Transactional email (verification, invites, billing receipts, security)
-- is never gated by this — only marketing/product-update email is.

alter table public.merchants
  add column if not exists email_prefs jsonb not null default '{"marketing": true, "product_updates": true}'::jsonb;

-- 2. Email events ----------------------------------------------------------
-- Idempotency ledger + delivery observability for every email this system
-- sends. A caller picks a deterministic idempotency_key per "this should
-- happen at most once" rule (e.g. 'welcome:<merchant_id>',
-- 'subscription_activated:<stripe_event_id>', 'reengagement_inactive:
-- <merchant_id>:<yyyy-mm>') and inserts before sending; a unique-violation
-- on that insert means "already sent, skip" — no separate lock needed.

create table public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  email_type text not null,
  recipient_email text not null,
  idempotency_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_events_merchant_id_idx on public.email_events(merchant_id);
create index email_events_user_id_idx on public.email_events(user_id);
create index email_events_email_type_idx on public.email_events(email_type);
create index email_events_provider_message_id_idx on public.email_events(provider_message_id);

alter table public.email_events enable row level security;

-- Service role only, deliberately no policies — internal delivery ledger,
-- not merchant-facing data. Same pattern as billing_events.
