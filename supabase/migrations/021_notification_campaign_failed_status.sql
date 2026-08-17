-- sendCampaignNow (lib/notifications/campaigns.ts) could throw between marking
-- a campaign "sending" and marking it "sent" (segment resolution error, or the
-- background execution getting cut short) with no terminal state to land on
-- afterward — status was 'draft'|'scheduled'|'sending'|'sent'|'canceled' only,
-- so those campaigns stayed "sending" forever with no recovery path. The code
-- fix wraps the send in try/catch so it always lands on a terminal status;
-- this adds the 'failed' status that catch block now writes.
alter table public.notification_campaigns
  drop constraint if exists notification_campaigns_status_check;
alter table public.notification_campaigns
  add constraint notification_campaigns_status_check
  check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed', 'canceled'));
