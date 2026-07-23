# Architecture

## High-Level Diagram
```
┌─────────────────────┐        ┌──────────────────────┐
│  Merchant Dashboard  │        │   Customer Wallet     │
│  (Next.js, auth'd)   │        │   Pass (Apple/Google)  │
└──────────┬───────────┘        └───────────┬───────────┘
           │                                │
           ▼                                ▼
┌─────────────────────────────────────────────────────┐
│               Next.js App (API Routes)                │
│  /api/programs  /api/customers  /api/scan  /api/wallet │
└──────────┬───────────────────────────┬───────────────┘
           │                           │
           ▼                           ▼
┌────────────────────┐      ┌────────────────────────┐
│     Supabase        │      │  Wallet Providers        │
│ Postgres + Auth +   │      │  - Apple PassKit (.pkpass)│
│ Storage + Realtime   │      │  - Google Wallet API      │
└────────────────────┘      └────────────────────────┘
           │
           ▼
┌────────────────────┐
│      Stripe          │
│ (merchant billing)   │
└────────────────────┘
```

## Repo Structure
```
/app
  /(marketing)              # public landing pages
  /(auth)
    /login
    /signup
  /dashboard                # merchant-only, auth-protected
    /programs
      /[programId]
        /page.tsx           # program detail/edit
        /customers          # customer list for this program
        /scan               # QR scan-to-award UI
    /analytics
    /settings
    /billing
  /pass/[passId]             # public customer-facing pass status page (no login)
  /api
    /programs                # CRUD for loyalty programs
    /customers                # CRUD for customer enrollments
    /scan                      # award stamp/point/step on scan
    /wallet
      /apple                   # generate & serve .pkpass, handle APNs registration
      /google                   # generate & serve Google Wallet objects
    /webhooks
      /stripe
/components
  /ui                        # shared design-system primitives
  /dashboard
  /wallet-preview             # live preview of stamp/point/step card design
/lib
  /supabase                  # client + server Supabase helpers
  /wallet
    apple.ts                  # PassKit pass generation
    google.ts                 # Google Wallet object generation
  /stripe
  /qrcode
  /validators                 # zod schemas shared across API + forms
/supabase
  /migrations                 # SQL migration files
/types                        # shared TypeScript types generated from DB schema
```

## Key Architectural Decisions

**Multi-tenancy**: every table scoped by `merchant_id`. Row Level Security (RLS) in Supabase enforces merchants only ever see their own data. See `02-database-schema.md`.

**Scanner PWA** (`app/[locale]/scan-app/`): a second, independent frontend for staff — installable (`public/manifest.json`, `public/sw.js`), no dashboard nav/topbar, full-screen dark theme. Shares the exact same backend as the dashboard's `/dashboard/scan` (`/api/scan`, `/api/scan/lookup`, `/api/scan/history`) and the same Supabase Auth + staff/roles model — the interactive scan/confirm/result UI itself lives once in `components/scanner/scan-flow.tsx` and is rendered by both frontends with different chrome around it. Route structure: `scan-app/layout.tsx` (unauthenticated shell — manifest/meta tags only, so `/scan-app/login` doesn't redirect-loop against itself) wraps both `scan-app/login/` (public) and `scan-app/(app)/` (auth-gated via `getSessionOrNull()` in `lib/api.ts`, redirects to login).

**Notifications are wallet-native** (migration 011, `lib/notifications/*`): no email/SMS/separate customer app. A campaign's message is delivered by writing it to `customer_progress.latest_notification_message` and pushing a wallet update carrying it — Apple gets a back-of-card field with `changeMessage: "%@"` (the OS shows it as a lock-screen notification when the device re-fetches after the APNs wake) and Google gets an entry appended to the loyalty object's `messages` array. This reuses the exact same `lib/wallet/*` pipeline as routine post-scan updates (`pushWalletUpdate` now takes an optional `notification` param), so it inherits the same graceful stub-without-credentials behavior — architecture-complete without live Wallet credentials. `reward_unlocked` fires inline from `/api/scan`; `birthday`/`expiring_reward`/`inactive_customer` are evaluated by a daily cron (`app/api/cron/notifications`, see `vercel.json`) per-merchant based on their `notification_prefs` toggles (Settings).

**Geolocation is wallet-native too** (migration 012, `lib/wallet/locations.ts`): store coordinates are embedded directly on the pass at generation time (PassKit's `locations` field / Google Wallet's `locations` on the loyalty object) — proximity detection and the lock-screen surfacing are entirely OS-level, no customer app, no polling service, no location permission prompt beyond what Wallet itself already requires. `getActiveStoreLocations()` is called from inside `generateApplePass`/`generateGoogleWalletLink`/`pushGooglePassUpdate` rather than threaded through every caller, matching how those functions already read merchant-level data like brand colors straight off their `merchant` param.

**Staff accounts & roles** (migration 005): a merchant (`merchants.id = auth.users.id`) is the implicit "owner." Non-owner team members get their own Supabase Auth login via `staff_accounts` (role: `admin`/`manager`/`staff`), invited through `supabase.auth.admin.inviteUserByEmail`. RLS extends every tenant-scoped table to also allow active staff of that merchant (`public.is_active_staff_of(merchant_id)`, a `SECURITY DEFINER` function — avoids recursive RLS on `staff_accounts` itself). RLS only controls row *visibility*; per-action authorization (can this role invite staff, redeem a reward, view billing) is a fixed capability matrix in `lib/auth/permissions.ts`, checked via `requireCapability()` in `lib/api.ts`. Existing routes built before staff accounts existed keep using the older owner-only `requireMerchant()` until deliberately reviewed for staff access.

**Customer identity without login**: a customer is identified by a unique `pass_id` (UUID) embedded in their wallet pass's QR code. No customer account/password. This is intentional — friction-free is the core value prop.

**Program types as one schema, not three tables**: `loyalty_programs.type` is an enum (`stamp` | `points` | `steps`). A single `customer_progress` table stores a JSON `progress` field whose shape depends on the parent program's type. This avoids duplicating enrollment/customer logic three times. Validate progress shape with a zod discriminated union based on `type`.

**Wallet pass updates**: whenever `customer_progress` changes, trigger a Supabase Postgres function/webhook (or a Next.js API call after the scan mutation) that:
1. Regenerates the pass payload
2. Pushes an update via APNs (Apple) or the Google Wallet API (Google) so the pass on the customer's phone refreshes automatically — this is the "wallet updates instantly" requirement, not a nice-to-have.

**Scan flow security**: the merchant scan endpoint must verify the scanning user is authenticated staff for that specific `merchant_id`, and that the scanned `pass_id` belongs to a program owned by that merchant, before mutating progress. Rate-limit to prevent abuse (e.g. one scan per pass per X seconds unless overridden).

**Billing**: Stripe Checkout + Customer Portal for subscription tiers (Free/Starter/Pro/Enterprise per `00-overview.md`). Gate feature access (e.g. number of active programs, number of active customers) via a `merchants.plan` field checked server-side on relevant API routes — never trust client-side plan checks alone.

## Environment Variables (expected)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
APPLE_PASS_TYPE_IDENTIFIER=
APPLE_TEAM_IDENTIFIER=
APPLE_PASS_CERTIFICATE=        # base64-encoded .p12
APPLE_PASS_CERTIFICATE_PASSWORD=
APPLE_WWDR_CERTIFICATE=
GOOGLE_WALLET_ISSUER_ID=
GOOGLE_WALLET_SERVICE_ACCOUNT_KEY=  # JSON, base64-encoded
```
Do not hardcode any of these. Flag to Ahmed if a feature needs a new env var rather than inventing a placeholder value silently.
