# StampWallet — Project Overview

## What This Is
StampWallet is a loyalty platform for small and medium businesses (SMBs). Merchants create a loyalty program in under 2 minutes; customers add a digital pass to Apple Wallet / Google Wallet and collect stamps, points, or progress through a reward journey — no app download, no plastic cards.

**We sell customer retention, not wallet technology.**

## Target Market
Coffee shops, bakeries, barbers, salons, gyms, restaurants, car washes, pet shops, clinics, pharmacies, hotels — bilingual Arabic/English, MENA/GCC first, expandable globally.

## MVP Scope (v1)
Three loyalty program types, all included in v1:

1. **Stamp Cards** — "Buy 10, get 1 free" style grid of stamps.
2. **Point Cards** — accumulate points toward a reward threshold.
3. **Reward Journey (Steps)** — a multi-stage path (e.g. Bronze → Silver → Gold → VIP, or Welcome Gift → Free Drink → Discount → Premium Gift), each stage unlocked in sequence.

Explicitly OUT of MVP scope (future phases — see `07-roadmap.md`):
- Gamification extras (badges, streaks, limited-time challenges)
- Referral rewards
- Location-triggered offers
- AI insights / churn prediction / smart recommendations
- White-label / multi-location enterprise features

## Core Experience
```
Merchant creates program (choose type: stamp / points / steps)
        ↓
Customer scans QR → Adds pass to Apple/Google Wallet
        ↓
Customer makes a purchase
        ↓
Merchant scans customer's pass QR (staff dashboard)
        ↓
Stamp/point/step progress updates instantly
        ↓
Wallet pass updates + push notification sent
        ↓
Reward unlocked → redeemed at till
```

## Two User Types
1. **Merchant** — signs up, creates/manages loyalty program(s), scans customers, views analytics.
2. **Customer** — no login required after first scan; interacts entirely through their Wallet pass. No app, no account creation friction.

## Tech Stack (confirmed)
- **Frontend/Backend**: Next.js 14 (App Router), TypeScript
- **Database/Auth/Storage**: Supabase (Postgres, Auth, Storage, Realtime)
- **Payments**: Stripe (merchant subscription billing)
- **Wallet passes**: Apple Wallet (PassKit / .pkpass) + Google Wallet (Google Wallet API)
- **Hosting**: Vercel
- **Push updates to passes**: Apple Push Notification service (APNs) for pass updates; Google Wallet API push for Google passes

See `01-architecture.md` for full technical breakdown.

## How to Use These Docs (for the AI agent / Cursor)
Read these files in order before writing code:
1. `00-overview.md` (this file) — product context
2. `01-architecture.md` — system design, folder structure, tech decisions
3. `02-database-schema.md` — Supabase schema, RLS policies
4. `03-mvp-features.md` — feature-by-feature spec with acceptance criteria
5. `04-api-endpoints.md` — API route contracts
6. `05-wallet-integration.md` — Apple/Google Wallet pass generation & update flow
7. `06-design-system.md` — visual/brand direction
8. `07-roadmap.md` — phased build order and post-MVP backlog

Also read `.cursorrules` at the project root — it defines coding conventions and constraints the agent must follow on every task in this repo.

Build in the phase order defined in `07-roadmap.md`. Do not jump ahead to post-MVP features unless explicitly asked.
