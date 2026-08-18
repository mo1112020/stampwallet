# Product State -- WalletOS

Codebase: `stampwallet` repo (product is branded WalletOS; `package.json` name is still the legacy `stampwallet`, version `0.1.0`).

## What It Does
Loyalty platform for SMBs -- stamp cards, points, and reward journeys delivered as Apple/Google Wallet passes. No customer app. See `.company/VISION.md` for full product context.

## Shipped (per `docs/07-roadmap.md` Phases 0-5)
- Merchant signup/onboarding, program creation (stamp / points / steps)
- Real Apple Wallet (.pkpass) + Google Wallet pass generation and push updates
- Customer enrollment via QR, no-login progress page (`/pass/[passId]`)
- Merchant scan-to-award + reward redemption
- Merchant dashboard: customers, analytics (base version), billing
- Stripe billing integration
- Bilingual (en/ar) with RTL support across customer- and merchant-facing surfaces
- Poster/QR download for in-store display (lazy-loaded PDF/image export)

## In Progress (Phase 6 -- production-readiness, 9 sub-phases)
See `.company/ROADMAP.md` for the full list. Evidence of active work from commit history: staff accounts/roles, scanner PWA, billing enforcement, notification campaigns, geolocation/geo-push radius. **Exact current sub-phase and completion status: unconfirmed -- ask Ahmed or check with Dev department directly rather than assuming.**

## Pricing (live in code, `lib/billing/plans.ts`)
- Free: 1 program, 100 customers
- Starter: $29-290/mo range
- Pro: $79-790/mo range
- Enterprise: contact sales, unlimited

*(Ranges suggest usage/seat-based tiers within Starter/Pro -- confirm exact tier structure with Product/CTO before quoting externally.)*

## Not Started (post-MVP backlog, no go-ahead yet)
Gamification, referral rewards, AI insights/churn prediction, smart recommendations, white-label/multi-brand reseller features.

## Status (as of 2026-08, per CEO)
- **Pre-launch.** 0 merchants/customers. MRR: $0.3 (as reported).
- Apple Wallet + Google Wallet: working
- Stripe: not live -- production billing still in progress (this is the current blocker on launch, alongside security hardening)
- Current focus: Phase 6 -- security fixes, finishing wallet integrations, finishing billing, MVP launch prep
