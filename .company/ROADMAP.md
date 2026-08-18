# WalletOS -- Roadmap

Source of truth: `docs/07-roadmap.md`. This file tracks status at the company-planning level; `docs/07-roadmap.md` remains the authoritative phase-by-phase build spec for the Dev/Product departments.

## Status Summary

**MVP (Phases 0-5): shipped**, per `docs/07-roadmap.md` and `README.md`'s phase map. This covers: foundation, program creation, real Apple/Google Wallet passes, scan & reward loop, merchant dashboard + billing, and launch-readiness polish (bilingual, empty/error states, basic rate limiting).

**Current stage: Phase 6 -- Production-Readiness Roadmap (approved, 9 sub-phases).** Per Ahmed (2026-08), current focus spans: sub-phase 1 (security fixes), finishing wallet integrations, finishing billing (sub-phase 7), and general MVP launch readiness -- not a single strict sub-phase in isolation. Exact per-sub-phase completion is still not itemized; check `.company/departments/dev/STATE.md` or ask before reporting any individual sub-phase as fully "done."

Confirmed integration status (2026-08):
- Apple Wallet + Google Wallet: **working**
- Stripe billing: **not live** -- production billing still in progress (blocks sub-phase 7 completion and, by extension, launch)

## Phase 6 Sub-Phases (strict dependency order)
1. Security & production-readiness hardening (unauthenticated wallet-pass-download endpoint, non-durable rate limiting, hardcoded dashboard branding)
2. Staff accounts, roles & permissions (Owner/Admin/Manager/Staff, multi-tenant from day one)
3. Scanner -- dashboard integration (real camera QR scan, replacing manual pass-ID paste)
4. Scanner -- installable PWA, separate frontend, shared backend/auth
5. Analytics dashboard (charts, trends, date-range filters, opt-in revenue/ROI)
6. Settings (business profile, branding, wallet branding, team, security, business metrics, data export, account deletion)
7. Billing & subscriptions (seat/usage limits, invoices, upgrade/downgrade)
8. Wallet-native notification system (Apple `changeMessage`/APNs + Google Wallet `messages` -- no email/SMS/separate customer app)
9. Geolocation (store locations, wallet-native proximity)

Wallet Apple/Google *credential* provisioning (real device testing, certs/issuer IDs) stays deferred per `docs/05-wallet-integration.md` -- the pipeline is built and no-ops gracefully without credentials.

## Post-MVP Backlog (not started -- do not build without explicit CEO go-ahead)
1. Gamification (badges, streaks, limited-time challenges)
2. Referral rewards
3. AI insights (best customers, churn risk, reward performance)
4. Smart reward recommendations
5. White-label / multi-brand reseller features

## Constraints
No external funding -- bootstrapped, solo founder. Every roadmap decision should default to low-cost/free infrastructure and lean scope over speed-at-any-cost.
