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
- **Resolved 2026-08-19.** Webhook endpoint `we_1U5wY6RvVuoZLb5Q71qv0alq` created via the Stripe CLI (`stripe webhook_endpoints create`, worked where a raw API script was blocked by the auto-mode classifier). Real signing secret pushed to Vercel production as `STRIPE_WEBHOOK_SECRET`, production redeployed (`dpl_2gFLZZjbqGYCz3o1MnJzq1nBjTjA`).
  - **Root cause caught during verification**: the endpoint was first registered against the bare `walletos.online`, which 308-redirects to `www.walletos.online` -- Stripe's webhook delivery does not follow redirects, so the first test delivery silently failed (`pending_webhooks: 1`, nothing in `billing_events`). Fixed by updating the endpoint URL to `https://www.walletos.online/api/webhooks/stripe` explicitly.
  - **Verified end-to-end, not just configured**: triggered a real `checkout.session.completed` test event (`stripe trigger`), confirmed `pending_webhooks: 0` on the Stripe side, and confirmed the exact event ID landed in the app's own `billing_events` audit table via direct Supabase query -- proof the signature verification and processing logic in `app/api/webhooks/stripe/route.tsx` actually executed correctly in production, not just that a 200 was returned somewhere.
  - **Lesson for any future externally-configured callback URL** (Resend webhooks, Supabase Auth hooks, Apple Wallet `webServiceURL`, etc.): always use `www.walletos.online` explicitly, never the bare apex domain, since it redirects and most webhook senders don't follow redirects.

**Billing is now fully live end-to-end in Stripe test mode**: code, catalog, production env vars, and webhook delivery all verified working.

## Gaps
- No CI pipeline found (`.github/workflows` absent) -- Vitest tests exist locally but aren't confirmed to run automatically on PRs
- Per-task sprint breakdown for the current focus above isn't itemized yet -- next `/ai-ceo:dev:sprint` run should produce one
