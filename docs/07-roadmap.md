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

## Post-MVP Backlog (do not build without explicit go-ahead)
Ordered roughly by likely value, not commitment:
1. Gamification — badges, streaks, limited-time challenges
2. Referral rewards
3. Birthday rewards
4. Location-triggered offers
5. Push notification campaigns (merchant-initiated, beyond automatic pass updates)
6. AI insights — best customers, churn risk, reward performance
7. Smart reward recommendations
8. Multi-location / white-label / Enterprise tier features
9. Staff accounts with granular permissions (currently: one merchant login = full access)

## Notes for the Agent
- After finishing each phase, summarize what was built and flag any assumptions made (especially around wallet certificates/credentials, which Ahmed must supply — see open questions in `05-wallet-integration.md`).
- If a task in a later phase turns out to depend on something not yet decided (e.g. the multi-program-enrollment question in `02-database-schema.md`), stop and ask rather than guessing and rebuilding later.
