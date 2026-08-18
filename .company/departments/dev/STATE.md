# Dev / Engineering -- State

Stack: see `.company/steering/tech-stack.md`. Build spec: `docs/01-architecture.md` through `docs/07-roadmap.md`.

## Recent Work (from git history, most recent first)
- Animated wallet demo added to homepage, replacing static card mockup
- Mobile-first pass: fixed touch-target/layout issues (3 items)
- Pinned Vercel functions to `dub1` (Dublin) to match Supabase's `eu-west-1`
- Deferred jsPDF/html-to-image loading to only fire on poster download (perf)
- Sitewide button hover/press feedback audit

This indicates active polish/hardening work consistent with the Phase 6 production-readiness stage (see `.company/ROADMAP.md`) rather than new-feature MVP work.

## Known Open Items (documented, not inferred)
Per `docs/07-roadmap.md` Phase 6 sub-phase 1 ("Security & production-readiness hardening"), these were flagged as real issues to fix:
- Unauthenticated wallet-pass-download endpoint
- Non-durable rate limiting
- Hardcoded dashboard branding

**Status of these three fixes: unconfirmed.** Verify current state in code before assuming they're resolved or still open.

## Current Focus (per CEO, 2026-08)
Phase 6 production-readiness: security fixes (done, see devops-security audit), finishing wallet integrations (Apple/Google already working), finishing billing, and MVP launch prep. No external funding -- default to low-cost/free infrastructure choices.

## Billing Investigation -- 2026-08-19
Checked `lib/billing/`, `app/api/billing/*`, `app/api/webhooks/stripe`, `lib/stripe/`, `scripts/seed-stripe-catalog.ts` for actual completeness (not just presence). **Billing is code-complete**: checkout/portal/subscription/usage/invoices routes, webhook handler, enforcement logic with tests (`enforcement.test.ts`), and a one-time catalog-seeding script all exist and handle missing credentials gracefully (`createStripeClientSafe()` returns null rather than crashing). No TODOs/FIXMEs found. **What remains is entirely operational, not code**: (1) a real Stripe secret key in `.env.local`, (2) run `npx tsx scripts/seed-stripe-catalog.ts` to create the pricing catalog and capture the price IDs, (3) register the webhook endpoint in the Stripe Dashboard and capture its signing secret. All three require the CEO's Stripe account access -- not something Dev can do independently.

## Gaps
- No CI pipeline found (`.github/workflows` absent) -- Vitest tests exist locally but aren't confirmed to run automatically on PRs
- Per-task sprint breakdown for the current focus above isn't itemized yet -- next `/ai-ceo:dev:sprint` run should produce one
