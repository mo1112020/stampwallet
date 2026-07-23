-- Optional business metrics backing the analytics revenue-impact KPI
-- (Phase 5). Nullable and opt-in — the owner was explicit that these
-- KPIs must be hidden, not estimated, when unconfigured. The editing UI
-- for these lands in Phase 6 (Settings); analytics just needs the fields
-- to exist so it isn't blocked waiting on that phase.
--
-- Per-program reward value lives in loyalty_programs.config (jsonb) —
-- no migration needed there, just a new optional key validated by
-- lib/validators/index.ts's cardAppearanceSchema.

alter table public.merchants
  add column if not exists currency text,
  add column if not exists average_order_value numeric;
