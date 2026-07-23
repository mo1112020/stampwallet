-- Phase 6 (Settings) schema additions.
-- timezone: used by this phase's language/timezone section, and by
--   Phase 8's campaign scheduling later.
-- notification_prefs: a preferences stub wired up for real once Phase 8
--   builds the actual send logic — the toggle exists and persists now,
--   nothing consumes it yet.

alter table public.merchants
  add column if not exists timezone text not null default 'UTC',
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;
