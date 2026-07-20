# StampWallet

Loyalty platform for SMBs — stamp cards, points, and reward journeys that live in Apple Wallet and Google Wallet.

## Stack

- Next.js 16.3 (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, RLS)
- Stripe (merchant billing)
- next-intl (en + ar, RTL)

## Quick start

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Paste URL, anon key, and service role key into `.env.local`
3. In the SQL editor, run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)

### 3. Seed (optional)

```bash
npm run seed
```

Demo merchant: `demo@stampwallet.local` / `demo-password-123`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) (Arabic: `/ar`).

## Environment variables

See [`.env.example`](.env.example). Required for local auth/DB:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Optional until later phases:

- Stripe keys + price IDs (billing)
- Apple PassKit certificates (real `.pkpass`)
- Google Wallet issuer + service account (real save links)

Without wallet certs, enrollment still works and returns **stub** Apple/Google responses.

## Phase map

| Phase | Status in codebase |
|-------|--------------------|
| 0 Foundation | App, migrations, auth, dashboard shell |
| 1 Programs | Onboarding, CRUD, wallet preview |
| 2 Wallet enroll | Public enroll + stubbed Apple/Google |
| 3 Scan & redeem | Scan API/UI, public `/pass/[passId]` |
| 4 Dashboard & billing | Analytics, CSV, Stripe checkout/portal/webhook |
| 5 Polish | i18n messages, rate limits, empty states, README |

## Docs

Product specs live in [`docs/`](docs/).

## Scripts

- `npm run dev` — local server
- `npm run build` — production build
- `npm run seed` — demo merchant + stamp program
- `npm run lint` — ESLint
