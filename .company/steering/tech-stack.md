# Tech Stack

Source of truth: `package.json`, `vercel.json`, `.env.example`, `docs/01-architecture.md`. Keep this file in sync when the stack changes -- agents should read this instead of re-deriving it from the codebase every time.

## Core
- **Framework**: Next.js 16.3 (preview), App Router, React 19, TypeScript
- **Styling**: Tailwind CSS 3.4, Radix UI primitives, custom design tokens in `app/globals.css`
- **i18n**: `next-intl` -- English + Arabic, full RTL support (`messages/en.json`, `messages/ar.json`)
- **Motion**: GSAP
- **Charts**: Recharts (dashboard analytics)
- **Maps**: Leaflet / react-leaflet (store locations)

## Data & Auth
- **Database/Auth/Storage**: Supabase (Postgres, Auth, Storage) -- RLS-based, `@supabase/ssr` + `@supabase/supabase-js`
- **Migrations**: `supabase/migrations/` -- 21 migrations as of this snapshot, actively evolving (staff accounts, billing enforcement, atomic scan events, etc.)

## Wallet Integration (the core product mechanic)
- **Apple Wallet**: `passkit-generator`, `node-forge` for cert handling, full PassKit web-service protocol implemented under `app/api/wallet/apple/v1/` (devices, registrations, passes, log endpoints)
- **Google Wallet**: `google-auth-library`, custom integration
- **QR/Barcode**: `bwip-js`, `qrcode` (generation), `@zxing/browser` + `@zxing/library` (scanning)
- Real Apple/Google Wallet certs are optional per `.env.example` -- the app runs with stub responses without them (credential provisioning status: see open question in `.company/STATE.md`)

## Billing
- **Payments**: Stripe (server-side; no client-side publishable key wired up yet per `.env.example`)
- Paddle was evaluated and replaced (`supabase/migrations/015_paddle_billing.sql` superseded by `016_stripe_billing.sql`)
- Plan tiers hardcoded in `lib/billing/plans.ts`: Free, Starter, Pro, Enterprise (program/customer/seat/location caps)

## Communications
- **Email**: Resend + `@react-email/components`, custom Supabase Auth email hook (`app/api/auth/email-hook`)
- **Poster/PDF export**: `jspdf`, `html-to-image`, `@resvg/resvg-js` -- lazy-loaded only when a poster is downloaded (perf optimization, see commit `49591eb`)

## Deployment & Ops
- **Hosting**: Vercel, region pinned to `dub1` (Dublin) to match Supabase's `eu-west-1` (commit `a3ddb2e`)
- **Cron jobs** (`vercel.json`): notifications 9am UTC, email-engagement 10am UTC, billing-enforcement 11am UTC
- **Containerization**: Dockerfile present (containerized build option available)
- **CI**: no `.github/workflows` found in this snapshot -- no automated CI pipeline configured yet
- **Testing**: Vitest (`vitest.config.ts`), scattered `*.test.ts` files under `app/api` and elsewhere

## Architecture Reference
Full technical breakdown: `docs/01-architecture.md`, `docs/02-database-schema.md`, `docs/04-api-endpoints.md`, `docs/05-wallet-integration.md`. These were written as pre-build specs for agent-driven development (see `.cursorrules` and `docs/00-overview.md`) and remain the authoritative technical reference -- read them before proposing architecture changes.
