# Sales -- State

## Model (inferred from product, not confirmed)
Self-serve signup exists in-product (merchant onboarding flow, `docs/03-mvp-features.md` F1). Whether there's any assisted/outbound sales motion on top of self-serve (e.g. for Enterprise tier, which is "contact sales" per `lib/billing/plans.ts`) is not confirmed.

## Motion (confirmed by CEO, 2026-08)
**Initially self-serve.** Direct outbound/partnerships planned for later, not active now. Matches pre-launch stage (0 merchants) -- no pipeline/lead data exists yet.

## Gaps
- No CRM integration found in the codebase (framework default references HubSpot, but that's a template default, not a confirmed tool in use) -- revisit once outbound motion starts
