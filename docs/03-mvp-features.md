# MVP Features & Acceptance Criteria

Scope: Stamp Cards + Point Cards + Reward Journey (Steps). Build in this file's order.

## F1. Merchant Signup & Onboarding
- Merchant signs up (Supabase Auth, email+password or magic link).
- Onboarding wizard: business name → industry → logo upload → brand colors → create first program.
- **Done when**: a new merchant can go from signup to a live, scannable QR code for their first program in under 2 minutes (matches brand promise — test this manually).

## F2. Create/Edit Loyalty Program
- Merchant picks a type: Stamp / Points / Steps.
- Type-specific config form (see `02-database-schema.md` for shapes):
  - Stamp: stamps required, reward description, icon/emoji picker.
  - Points: points-per-reward threshold, reward description, points label.
  - Steps: ordered list of stages, each with a label and threshold (add/remove/reorder stages).
- Live preview panel showing what the customer's wallet pass will look like as they edit (use `components/wallet-preview`).
- **Done when**: merchant can create, edit, and deactivate a program of each type.

## F3. Customer Enrollment (QR → Wallet)
- Each program has a persistent enrollment QR code (points to `/pass/new?program={id}`, or similar).
- Customer scans with phone camera → lands on a mobile web page → taps "Add to Apple Wallet" or "Add to Google Wallet" → pass installs.
- On first add, a `customers` + `customer_progress` row is created with a fresh `pass_id`, starting progress at zero.
- Optional: collect name/phone/email on this page before issuing the pass (merchant-configurable toggle — confirm with Ahmed whether this is required or optional per program).
- **Done when**: a real Apple and Android device can each complete this flow and see the pass appear in Wallet/Google Wallet.

## F4. Merchant Scan-to-Award
- Staff-facing scan page (`/dashboard/scan` — a primary nav item, not nested under a specific program since a pass's `pass_id` already identifies its program) using device camera (`@zxing/browser`, via `components/dashboard/scanner/camera-scanner.tsx`) to scan a customer's pass QR.
- On scan: look up `customer_progress` by `pass_id`, confirm it belongs to a program owned by the authenticated merchant, then increment progress per program type:
  - Stamp: +1 stamp (cap at `stamps_required`; if it completes the card, mark reward available and reset or flag for redemption per merchant preference).
  - Points: merchant enters or taps a preset point value to add.
  - Steps: advance `current_value`; check thresholds to see if a new stage unlocked.
- Every scan writes a `scan_events` row.
- After mutation, trigger wallet pass push update (see `05-wallet-integration.md`) so the customer's pass refreshes within seconds.
- **Done when**: a scan reliably updates the DB, logs an event, and the customer's physical wallet pass visibly updates without them reopening the app.

## F5. Reward Redemption
- When a customer's progress crosses the reward threshold, the merchant scan screen shows "🎁 Reward Available — Redeem?" with a confirm button.
- Confirming writes a `redemptions` row and resets/advances progress appropriately (stamp: reset to 0; points: subtract threshold or reset per config; steps: move to next stage).
- **Done when**: redemption is logged and reflected correctly on the customer's pass.

## F6. Customer Progress Page (no login)
- Public page at `/pass/[passId]` showing current progress in a friendly visual (mirrors the wallet pass) — useful if the customer isn't near their phone's wallet or wants a shareable link.
- **Done when**: page loads for a valid `pass_id`, shows correct real-time progress, 404s gracefully for invalid IDs.

## F7. Merchant Dashboard — Customers & Analytics (MVP-light)
- List of enrolled customers per program with current progress.
- Basic counts: total enrolled, total rewards redeemed, redemptions this week/month.
- Export customers to CSV.
- **Done when**: numbers match the underlying `scan_events`/`redemptions` tables exactly (write a quick script or test to cross-check).

## F8. Billing (Stripe)
- Free plan default on signup (1 active program, capped active customers — confirm cap number with Ahmed before hardcoding).
- Upgrade flow via Stripe Checkout to Starter/Pro.
- Stripe webhook updates `merchants.plan`.
- Server-side plan gate on: creating a 2nd+ program (Free), exceeding customer cap (Free), custom branding (Starter+).
- **Done when**: upgrading/downgrading in Stripe test mode correctly changes what the merchant can do in the dashboard.

## Explicitly Deferred (do not build in MVP)
Gamification badges/streaks, referral rewards, VIP tiers beyond what "steps" already covers, AI insights/churn prediction, smart reward recommendations, white-label/reseller branding. See `07-roadmap.md`.

Staff accounts/roles, push/wallet-native notifications (including birthday rewards), and location-triggered offers were deferred at MVP time but are now approved and in progress as `07-roadmap.md`'s Phase 6 production-readiness roadmap — no longer "explicitly deferred," just sequenced after MVP.
