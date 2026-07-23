# Build Roadmap

Build strictly in this phase order. Do not start a later phase before the previous one's "done when" criteria (see `03-mvp-features.md`) are met.

## Phase 0 — Foundation
- Next.js project scaffold, TypeScript, Supabase project + migrations for all tables in `02-database-schema.md`, RLS policies, auth (merchant signup/login).
- CI-friendly local dev setup (env vars documented, seed script for a demo merchant + program).

## Phase 1 — Program Creation Core
- F1 Merchant Signup & Onboarding
- F2 Create/Edit Loyalty Program (all three types)
- Wallet preview component (static, no real pass generation yet)

## Phase 2 — Real Wallet Passes
- F3 Customer Enrollment (QR → Wallet)
- Full Apple Wallet integration (generation + push updates)
- Full Google Wallet integration
- This is the highest-risk phase — allocate the most testing time here (real devices, both platforms).

## Phase 3 — Scan & Reward Loop
- F4 Merchant Scan-to-Award
- F5 Reward Redemption
- F6 Customer Progress Page (no login)

## Phase 4 — Dashboard & Billing
- F7 Merchant Dashboard — Customers & Analytics
- F8 Billing (Stripe)

## Phase 5 — Polish & Launch Readiness
- Bilingual (en/ar) pass across all customer- and merchant-facing surfaces
- Empty states, error states, loading states audit
- Basic rate limiting / abuse prevention on public endpoints (`/api/customers/enroll`, `/api/scan`)
- Manual QA pass on real iPhone + Android device end-to-end

## Phase 6 — Production-Readiness Roadmap (approved, supersedes the backlog below for these items)

MVP (Phases 0-5) shipped. The next stage of work — security hardening, staff accounts/roles, a real in-dashboard + PWA scanner, analytics, complete settings, seat/usage-based billing, and a wallet-native notification system — is tracked as its own 9-phase roadmap (Phase 1 → 9 within this stage), executed in strict dependency order. Full detail (file-level guidance, reasoning per phase) lives in the working plan for that effort; the phase list is:

1. Security & production-readiness hardening (real bugs: an unauthenticated wallet-pass-download endpoint, non-durable rate limiting, hardcoded dashboard branding)
2. Staff accounts, roles & permissions (Owner/Admin/Manager/Staff, multi-tenant from day one)
3. Scanner — dashboard integration (real camera QR scan, replacing the manual pass-ID paste form)
4. Scanner — installable PWA, separate frontend from the dashboard, shared backend/auth
5. Analytics dashboard (charts, trends, date-range filters, opt-in revenue/ROI)
6. Settings (business profile, branding, wallet branding, team, security, business metrics, data export, account deletion)
7. Billing & subscriptions (seat limits + usage limits, invoices, upgrade/downgrade)
8. Wallet-native notification system (Apple `changeMessage`/APNs + Google Wallet `messages` — no email/SMS/separate customer app; architecture is credential-agnostic, ready to activate once wallet credentials land)
9. Geolocation (store locations, wallet-native proximity via `PKPass.setLocations()` / Google's equivalent — no customer app needed)

Wallet Apple/Google *credential* work (real device testing, obtaining certs/issuer IDs) stays deferred per `05-wallet-integration.md`'s open questions — the wallet-push code and PassKit web service protocol are already built and gracefully no-op without credentials; Phases 8-9 above build on top of that pipeline rather than duplicating it.

## Post-MVP Backlog (remaining items — still do not build without explicit go-ahead)
1. Gamification — badges, streaks, limited-time challenges
2. Referral rewards
3. AI insights — best customers, churn risk, reward performance
4. Smart reward recommendations
5. White-label / multi-brand reseller features (distinct from the multi-location support already covered by Phase 9 above)

Moved out of backlog, now approved and scheduled above: staff accounts/roles (Phase 2), push/wallet-native notifications (Phase 8), location-triggered offers (Phase 9). Birthday rewards are covered as one of Phase 8's automated notification triggers.

## Notes for the Agent
- After finishing each phase, summarize what was built and flag any assumptions made (especially around wallet certificates/credentials, which Ahmed must supply — see open questions in `05-wallet-integration.md`).
- If a task in a later phase turns out to depend on something not yet decided (e.g. the multi-program-enrollment question in `02-database-schema.md`), stop and ask rather than guessing and rebuilding later.
