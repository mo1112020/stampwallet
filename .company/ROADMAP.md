# WalletOS -- Roadmap

Source of truth: `docs/07-roadmap.md`. This file tracks status at the company-planning level; `docs/07-roadmap.md` remains the authoritative phase-by-phase build spec for the Dev/Product departments.

## Status Summary

**MVP (Phases 0-5): shipped**, per `docs/07-roadmap.md` and `README.md`'s phase map. This covers: foundation, program creation, real Apple/Google Wallet passes, scan & reward loop, merchant dashboard + billing, and launch-readiness polish (bilingual, empty/error states, basic rate limiting).

**Current stage: Phase 6 -- Production-Readiness Roadmap.** All 9 sub-phases audited end-to-end 2026-08-19 (not just "files exist" checks -- actual code tracing, and for billing/notifications, live test events). Full table below. Apple Wallet + Google Wallet confirmed working; Stripe billing confirmed live end-to-end in test mode with a real signature-verified webhook delivery logged in `billing_events`.

**Remaining before real launch**: company registration (blocks switching Stripe to live mode -- see `.company/departments/legal/STATE.md`), the wallet-branding gap, the analytics opt-in copy bug, and real-device testing of the scanner PWA/wallet notifications once Apple/Google credentials are fully provisioned. See the table and "Still Open" section below.

## Phase 6 Sub-Phases -- Full Audit Complete (2026-08-19)

Every sub-phase below was independently verified by actually reading the code and tracing data flow (not just checking files exist). Two real bugs were found and fixed same-day; details in `.company/departments/dev/STATE.md`.

| # | Sub-Phase | Status | Notes |
|---|---|---|---|
| 1 | Security & production-readiness hardening | **Done** | See `devops-security/audit-2026-08-19.md` |
| 2 | Staff accounts, roles & permissions | **Done** (fixed 2026-08-19) | Identity/RLS/invite-flow genuinely solid. Found + fixed: Admin/Manager could see program-management UI but every save 401'd (routes still used owner-only `requireMerchant()`) |
| 3 | Scanner -- dashboard integration | **Done** | Real zxing camera scanner, fully wired to `/api/scan`, sensible search fallback (not a paste form) |
| 4 | Scanner -- installable PWA | **Done** | Real manifest + hand-rolled service worker + separate frontend, shared auth. Caveat: icons are placeholder-quality, never tested on a real device |
| 5 | Analytics dashboard | **Done** | Real recharts + live Supabase data + working date filter. Opt-in copy bug fixed 2026-08-19 (see below) |
| 6 | Settings | **Done, per CEO product call 2026-08-19** | Business profile, team, business metrics, data export, account deletion, branding(logo) all real. Security is real but password-only (no 2FA/session list). "Wallet branding" is intentionally per-program (color picker in the program editor), not a merchant-wide setting -- confirmed as the intended design, not a gap. Merchant-level `brand_color_primary/secondary` (set once at onboarding) is just a default seed for new programs. |
| 7 | Billing & subscriptions | **Done** | Verified end-to-end in test mode (see prior entries below) |
| 8 | Wallet-native notifications | **Done** (fixed 2026-08-19) | Real APNs HTTP/2 push + real Google Wallet `messages` API + real cron-driven triggers (6 total: reward_unlocked, birthday, expiring_reward, inactive_customer, billing_paused, billing_restored). Found + fixed: settings page told merchants this was "coming soon" when it was actually already live |
| 9 | Geolocation | **Done** | Real Leaflet map picker; confirmed locations actually flow into both Apple's `pass.json` and Google's `loyaltyObject.locations` on issue and update |

### Still Open
- Neither Scanner PWA nor the wallet notification/geolocation pipeline has been tested on a real device with live Apple/Google credentials -- explicitly deferred per `docs/05-wallet-integration.md`, not a regression. The pipeline is built and no-ops gracefully without credentials.
- Scanner PWA icons are placeholder-quality (functional, not final branded art).

**All 9 Phase 6 sub-phases are now genuinely done.** Remaining blockers to real launch are business, not engineering: company registration (live Stripe) and real-device testing.

## Post-MVP Backlog (not started -- do not build without explicit CEO go-ahead)
1. Gamification (badges, streaks, limited-time challenges)
2. Referral rewards
3. AI insights (best customers, churn risk, reward performance)
4. Smart reward recommendations
5. White-label / multi-brand reseller features

## Constraints
No external funding -- bootstrapped, solo founder. Every roadmap decision should default to low-cost/free infrastructure and lean scope over speed-at-any-cost.
