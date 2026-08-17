-wh
alter table public.notification_campaigns
  drop constraint if exists notification_campaigns_status_check;
alter table public.notification_campaigns
  add constraint notification_campaigns_status_check
  check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed', 'canceled'));
