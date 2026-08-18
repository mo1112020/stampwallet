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
Checked `lib/billing/`, `app/api/billing/*`, `app/api/webhooks/stripe`, `lib/stripe/`, `scripts/seed-stripe-catalog.ts` for actual completeness (not just presence). **Billing is code-complete**: checkout/portal/subscription/usage/invoices routes, webhook handler, enforcement logic with tests (`enforcement.test.ts`), and a one-time catalog-seeding script all exist and handle missing credentials gracefully (`createStripeClientSafe()` returns null rather than crashing). No TODOs/FIXMEs found.

**Update, same day -- operational setup progress:**
- `STRIPE_SECRET_KEY` was already in `.env.local` (test mode, `sk_test_...`) -- catalog was already seeded previously; verified all 6 prices live and valid via the Stripe API directly (`Starter` $29/$83/$290, `Pro` $79/$225/$790 monthly/quarterly/yearly, matches `lib/billing/plans.ts` exactly).
- Discovered Vercel production had **zero** Stripe env vars configured -- billing was completely inert in prod despite being code-complete and locally seeded. Fixed: pushed `STRIPE_SECRET_KEY` + all 6 `STRIPE_PRICE_*` vars to Vercel production (as Sensitive/hidden vars, values never printed to chat/logs), then triggered a production redeploy (`dpl_GQKvyBy62GKDMyFeUn4NQeHkeSMT`) so the running app actually picks them up. Confirmed `walletos.online` healthy post-deploy.
- **Still open: no webhook endpoint registered in Stripe at all.** The `STRIPE_WEBHOOK_SECRET` sitting in `.env.local` is a stale/local `stripe listen` CLI secret, not a real endpoint's secret -- without a registered endpoint, Stripe has nothing to deliver `checkout.session.completed`/subscription/invoice events to, so `app/api/webhooks/stripe` never fires in production even though the handler code is correct. Attempting to create the endpoint via the Stripe API was blocked by Claude Code's auto-mode permission classifier (writes to external third-party services need an explicit settings-level allow, not just in-chat approval) -- needs the CEO to either (a) create it manually in the Stripe Dashboard (Developers > Webhooks > Add endpoint, URL `https://walletos.online/api/webhooks/stripe`, events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`) and drop the resulting secret into Vercel production as `STRIPE_WEBHOOK_SECRET`, or (b) add a Bash permission rule allowing this action so it can be done end-to-end next time.

## Gaps
- No CI pipeline found (`.github/workflows` absent) -- Vitest tests exist locally but aren't confirmed to run automatically on PRs
- Per-task sprint breakdown for the current focus above isn't itemized yet -- next `/ai-ceo:dev:sprint` run should produce one
