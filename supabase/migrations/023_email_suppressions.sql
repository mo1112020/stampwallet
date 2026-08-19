-- Bounce/complaint suppression list.
--
-- Until now, a Resend `email.bounced`/`email.complained` webhook event only
-- ever updated the one email_events row it referenced (status -> "failed")
-- — nothing stopped the same address from being emailed again on the next
-- verification reminder, upgrade prompt, or billing notice. Repeated sends
-- to a bounced/complained address degrade sender reputation for every
-- outbound email this app sends, transactional included (password resets,
-- invoices). See lib/email/send.ts for the send-path check this table
-- drives, and app/api/webhooks/resend/route.ts for what populates it.

create table public.email_suppressions (
  -- Normalized lowercase, matching how sendTransactionalEmail checks it —
  -- case is not a meaningful distinction for an email address here.
  email text primary key,
  reason text not null check (reason in ('bounced', 'complained')),
  created_at timestamptz not null default now()
);

alter table public.email_suppressions enable row level security;
-- Service role only, deliberately no policies — internal delivery-control
-- list, not merchant-facing data. Same pattern as email_events/billing_events.
