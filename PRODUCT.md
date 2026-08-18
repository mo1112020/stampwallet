# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: SMB owners/staff in the MENA/GCC region (cafés, salons, gyms, restaurants, retail/services) — non-technical operators who want to launch a loyalty program fast, manage it from a merchant dashboard, and have staff scan customer wallet passes at the register with a phone camera.

Secondary: their end customers, who enroll via a QR code and receive an Apple Wallet or Google Wallet pass. They never install an app and never create an account beyond giving a name and phone number.

## Product Purpose

WalletOS lets small and medium businesses launch digital loyalty (stamp cards, point cards, staged reward journeys) that lives natively in Apple Wallet and Google Wallet — no app for the customer to download, no new hardware for staff. Success means customers return more often because the reward pass is always in their pocket and updates itself after every visit.

## Positioning

"We sell customer retention, not wallet technology." The differentiator isn't the wallet pass itself — it's the whole flow being frictionless enough for a busy counter: signup to a live enrollment QR in under two minutes, customer enrollment with just a name and phone number, and progress that updates the pass instantly on every scan with no manual refresh.

## Operating Context

- Merchant side: a web dashboard for creating programs, viewing/exporting customers, scanning to award or redeem (any phone camera, no dedicated hardware), sending notification campaigns, and billing.
- Customer side: no interface beyond the wallet pass itself — no login, no app.
- MENA/GCC-first market; both the marketing site and the dashboard are bilingual Arabic/English with full RTL layout support.
- The staff-facing scan flow happens at a physical counter or register, often on a personal phone.

## Capabilities and Constraints

- Three program types: stamp cards, point cards, and multi-stage reward journeys.
- Apple PassKit (`.pkpass`) and Google Wallet loyalty objects are generated from one shared field model; passes push live updates (stamps, points, reward-ready) straight to the lock screen.
- Multi-tenant: merchants only ever see their own programs and customers.
- Billing via Stripe; current tiers are Free (1 active program, up to 100 customers), Starter, and Pro (see pricing page for live limits/pricing).
- The scan API is authenticated, rate-limited, and audit-logged.
- Redesign scope for this project: the marketing site **and** the merchant dashboard app (not just the public pages).
- Bilingual Arabic/English + RTL is a hard functional requirement the redesign must carry through — confirmed explicitly, independent of whatever visual system replaces the current one.

## Brand Commitments

- The current name "WalletOS" and its logo mark are **not** binding — explicitly open to full replacement as part of this redesign.
- The Apple Wallet / Google Wallet trust badges/icons used on the site follow Apple's and Google's own brand guidelines and should be treated as an external asset constraint even though the rest of the identity is open.

## Evidence on Hand

Pre-launch / early stage: no real paying customers, testimonials, customer logos, or usage numbers exist yet. Do not fabricate testimonials, customer counts, case studies, or press mentions anywhere in the redesign — copy must stay honest about this stage.

## Product Principles

1. Frictionless for the end customer always wins over feature richness — no accounts, no apps, just a pass.
2. Speed to value for the merchant — signup to a live enrollment QR in minutes, not days.
3. The wallet pass is the product's real interface; the dashboard exists to manage what shows up there.
4. Never fabricate social proof — this is a pre-launch product and copy must stay honest about that.
5. MENA/GCC bilingual support is core infrastructure, not a localization afterthought.

## Accessibility & Inclusion

Full RTL layout support is required and already implemented across the marketing site and dashboard navigation. No other explicit accessibility standard has been confirmed yet.
