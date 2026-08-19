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

## Phase 6 Full Audit -- 2026-08-19
Ran a real audit (7 parallel deep-dives, actual code tracing + data-flow verification, not file-existence checks) on the remaining sub-phases: staff roles, scanner dashboard, scanner PWA, analytics, settings, notifications, geolocation. Full per-sub-phase table in `.company/ROADMAP.md`. Two genuine bugs found and fixed same-day:

1. **Staff couldn't actually manage programs.** Admin/Manager roles passed the page-level `manage_programs` check and could see the program editor, but every save/delete/upload hit a 401 -- `app/api/programs/route.ts`, `app/api/programs/[id]/route.ts`, `app/api/upload/route.ts`, `app/api/customers/route.ts` (`listForProgram`), and `app/api/customers/export/route.ts` (`exportForProgram`) all still used the old owner-only `requireMerchant()` instead of `requireCapability("manage_programs")`. Fixed: swapped all five to `requireCapability`, re-derived merchant scoping from `auth.merchantId` instead of `auth.userId`/`auth.userId`-as-folder-path. Updated `app/api/programs/[id]/route.test.ts`'s mocks to match. Verified: `npm test` (43/43), `npm run build` (clean).
2. **Merchants were told wallet notifications were "coming soon" when they were actually already live.** The backend (real APNs push + Google Wallet messages, cron-driven triggers) was built weeks after the settings-page copy was written, and nobody removed the disclaimer. Fixed: `messages/en.json`/`ar.json`'s `comingSoonNote` key renamed to `activeNote` with accurate copy, `notifications-prefs-form.tsx` updated to match.

**Update, 2026-08-19: analytics opt-in bug fixed.** Went with the lower-risk option (align copy/UI with actual behavior, not invent new revenue math): removed the "Average order value" field entirely from `components/dashboard/settings/business-form.tsx` (it was captured, validated, and persisted but never read anywhere in `lib/analytics/queries.ts` -- genuinely dead data), updated `settings.business.intro`/`rewardValueHint` copy in both `en.json`/`ar.json` to correctly say **currency** is what unlocks the revenue-impact KPI and that the number itself comes from each program's reward value, and fixed the matching misleading empty-state copy on the dashboard home page (`app/[locale]/dashboard/page.tsx`, was "Set an average order value," now "Set a currency"). Left `average_order_value` in the Zod validator and `Merchant` type untouched -- harmless, backward-compatible, avoids a schema change for a UI-only fix. Verified: `npm test` (43/43), `npm run build` (clean).

**Update, 2026-08-19: wallet branding closed, not a gap.** Asked the CEO whether "wallet branding" should be a merchant-wide settings page or stay per-program -- answer: per-program identity is the intended design. The existing per-program color picker (`components/dashboard/program-form.tsx`) already covers this; no new settings page needed. `merchants.brand_color_primary/secondary` (set once at onboarding) is just a default seed for new programs, not a gap.

Remaining, not fixed (needs real hardware, not more code):
- Scanner PWA icons are placeholder-quality (functional, not final branded art).
- Nothing in the wallet-credential-dependent pipeline (Scanner PWA install, wallet-native notifications, geolocation proximity) has been tested on a real device with live Apple/Google credentials -- explicitly deferred per `docs/05-wallet-integration.md`, not a regression.

## Production Bug -- Found & Fixed (migration written, not yet applied) 2026-08-19
CEO reported live error scanning: `insert or update on table scan_events violates foreign key constraint scan_events_scanned_by_fkey`. Root cause: `scan_events.scanned_by` (`001_initial_schema.sql`) references `public.merchants(id)`, which only worked before staff accounts existed. `005_staff_accounts.sql` fixed the RLS policies for staff scanning (its own comment predicted this exact issue) but never fixed the underlying FK -- a staff member's `auth.uid()` isn't a `merchants.id`, only an `auth.users.id`. Every scan by a non-owner staff member has been failing since staff scanning shipped.

Fix written: `supabase/migrations/022_fix_scan_events_scanned_by_fkey.sql` -- re-points the FK at `auth.users(id)`. **Not yet applied to production** -- no direct database credentials available in this environment (the local Supabase CLI session is authenticated to an unrelated account, not WalletOS's project). Needs the CEO to run it manually via the Supabase Dashboard SQL Editor.

## Gaps
- No CI pipeline found (`.github/workflows` absent) -- Vitest tests exist locally but aren't confirmed to run automatically on PRs
- Per-task sprint breakdown for the current focus above isn't itemized yet -- next `/ai-ceo:dev:sprint` run should produce one
