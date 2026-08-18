# WalletOS -- Vision

Source of truth: `docs/00-overview.md`. CEO: Ahmed Mekled. Site: walletos.online.

## Mission
**We sell customer retention, not wallet technology.**

WalletOS is a loyalty platform for small and medium businesses (SMBs). Merchants create a loyalty program in under 2 minutes; customers add a digital pass to Apple Wallet / Google Wallet and collect stamps, points, or progress through a reward journey -- no app download, no plastic cards.

## Target Market
Coffee shops, bakeries, barbers, salons, gyms, restaurants, car washes, pet shops, clinics, pharmacies, hotels -- bilingual Arabic/English, **MENA/GCC first, expandable globally**.

## Product Scope (v1 / MVP)
Three loyalty program types, all in v1:
1. **Stamp Cards** -- "buy 10, get 1 free" style grid
2. **Point Cards** -- accumulate points toward a reward threshold
3. **Reward Journey (Steps)** -- multi-stage path (e.g. Bronze -> Silver -> Gold -> VIP), each stage unlocked in sequence

Explicitly out of scope for now (see `.company/ROADMAP.md` post-MVP backlog): gamification extras, referral rewards, location-triggered offers, AI insights/churn prediction, white-label/multi-brand reseller features.

## Two User Types
1. **Merchant** -- signs up, creates/manages loyalty program(s), scans customers, views analytics
2. **Customer** -- no login required after first scan; interacts entirely through their Wallet pass. No app, no account-creation friction.

## Core Experience Loop
```
Merchant creates program (stamp / points / steps)
        v
Customer scans QR -> Adds pass to Apple/Google Wallet
        v
Customer makes a purchase
        v
Merchant scans customer's pass QR (staff dashboard / scan-app)
        v
Stamp/point/step progress updates instantly
        v
Wallet pass updates + push notification sent
        v
Reward unlocked -> redeemed at till
```

## Current Stage
Pre-launch, 0 merchants, bootstrapped (no external funding), solo founder + AI agents. Focus is finishing Phase 6 production-readiness (security, wallet integrations, billing) to reach MVP launch. See `.company/STATE.md` and `.company/ROADMAP.md`.

## Open Questions (ask Ahmed before treating as settled)
- Longer-term vision beyond MENA/GCC expansion -- any specific timeline or market sequencing beyond "expandable globally"?
