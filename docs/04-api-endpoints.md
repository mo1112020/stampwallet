# API Endpoint Contracts

All routes under `/app/api/`. Auth'd merchant routes read the Supabase session server-side; never trust a client-supplied `merchant_id`.

## Programs
- `POST /api/programs` — create program. Body: `{ name, type, config }`. Validates `config` against the zod schema matching `type`. Returns created program + enrollment QR data.
- `GET /api/programs` — list programs for authenticated merchant.
- `GET /api/programs/[id]` — get one (must belong to merchant).
- `PATCH /api/programs/[id]` — update name/config/is_active.
- `DELETE /api/programs/[id]` — soft delete (set `is_active = false`), never hard-delete a program with existing customers.

## Customers / Enrollment
- `POST /api/customers/enroll` — public (no auth). Body: `{ program_id, name?, phone?, email? }`. Creates `customers` + `customer_progress` row with new `pass_id`. Returns `pass_id` and a signed URL/token to fetch the generated wallet pass.
- `GET /api/customers` — list enrolled customers for a program (merchant-auth'd, filter by `program_id` query param).
- `GET /api/customers/export` — CSV export (merchant-auth'd).

## Scan / Award
- `POST /api/scan` — merchant-auth'd. Body: `{ pass_id, action, amount? }` where `action` is `award` or `redeem`. Server:
  1. Look up `customer_progress` by `pass_id`, verify its program's `merchant_id` matches the authenticated merchant.
  2. Apply progress delta per program type rules (see `03-mvp-features.md` F4).
  3. Write `scan_events` row.
  4. If `action === "redeem"`, write `redemptions` row.
  5. Trigger wallet push update (see `05-wallet-integration.md`).
  6. Return updated progress + whether a reward just became available.
- Rate limit: both `award` and `redeem` are rate-limited per `pass_id` (10s / 3s windows respectively) via the Postgres-backed `check_rate_limit` function (`lib/rate-limit.ts`, migration 004) — not an in-process limiter, so it's correct across multiple serverless instances. Fails open (allows the request) if the rate-limit check itself errors.
- Uses `requireCapability("scan")` (owner or any staff role) — not the owner-only `requireMerchant()`.
- `GET /api/scan/lookup?pass_id=` — read-only peek at a pass (customer info, program type/config, current progress) before committing an award/redeem. Used by the scanner UI to show a confirm screen (e.g. prompt for a points amount) without mutating anything.
- `GET /api/scan/history?program_id=&limit=` — recent `scan_events` for the authenticated merchant/staff, joined to customer + program names, for the scanner's "recent scans" panel.

## Wallet
- `GET /api/wallet/apple/[passId]?token=<apple_auth_token>` — generates and streams a signed `.pkpass` file for the given pass (used by our own "Add to Apple Wallet" button, not by Apple's protocol). Requires the pass's `apple_auth_token` as a query param — this is a direct browser-navigated link (no custom headers possible), so the secret travels as `?token=` rather than an `Authorization` header like the real PassKit protocol below. 401s without a matching token.
- `GET /api/wallet/google/[passId]?token=<google_auth_token>` — generates the "Add to Google Wallet" JWT/link for the given pass. Same `?token=` requirement, checked against `customer_progress.google_auth_token`.
- `webServiceURL` in every generated pass points at `/api/wallet/apple`. Apple's own PassKit Web Service protocol appends `v1/...` to that, implemented under `app/api/wallet/apple/v1/`:
  - `POST /api/wallet/apple/v1/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]/[serialNumber]` — device registers for push updates. Auth'd via `Authorization: ApplePass <token>` checked against `customer_progress.apple_auth_token`. Writes to `apple_device_registrations`.
  - `DELETE` same path — device unregisters.
  - `GET /api/wallet/apple/v1/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]?passesUpdatedSince=` — returns serial numbers of that device's passes updated since the given tag.
  - `GET /api/wallet/apple/v1/passes/[passTypeIdentifier]/[serialNumber]` — returns the current signed `.pkpass` (or 304 via `If-Modified-Since`).
  - `POST /api/wallet/apple/v1/log` — receives Apple's client-side error logs.
  - See `05-wallet-integration.md` for the full push flow.

## Settings / Team
- `GET /api/settings/team` — list active/invited staff for the authenticated merchant. Requires the `manage_staff` capability (owner or admin) via `requireCapability()`.
- `POST /api/settings/team` — invite a staff member. Body: `{ email, role }` where `role` is `admin`/`manager`/`staff`. Enforces `PLAN_LIMITS[plan].maxSeats` (owner counts as one seat). Uses `auth.admin.inviteUserByEmail` (service role) to create the Supabase Auth identity, then a `staff_accounts` row with `status: "invited"`.
- `PATCH /api/settings/team/[staffId]` — update `role` and/or `status` (`active`/`revoked`) for a staff member belonging to the caller's merchant.
- `DELETE /api/settings/team/[staffId]` — revoke access (soft: sets `status: "revoked"`, does not delete the underlying Supabase Auth user).
- These routes use `requireCapability("manage_staff")` (`lib/api.ts`), not the older owner-only `requireMerchant()` — see `01-architecture.md`.

## Settings
- `PATCH /api/settings/merchant` — single endpoint for every settings section that's "just a field on the merchants row" (profile, branding, business metrics, locale/timezone, notification prefs) — each form PATCHes only the fields it owns. Requires the `manage_settings` capability (owner or admin).
- `GET /api/settings/export` — full-account JSON bundle (merchant, programs, customers, customer_progress, scan_events, redemptions), distinct from the per-program CSV at `/api/customers/export`.
- `DELETE /api/settings/account` — irreversible. Requires the `delete_account` capability (owner only) and a `confirm_business_name` body field matching the merchant's exact business name as a safety net on top of the UI's own confirmation dialog. Cascades via the existing FK chain (migrations 001/005) — nothing else to clean up.

## Public Customer Page
- `GET /pass/[passId]` — (page, not API) server-renders current progress by looking up `customer_progress` via service role key.

## Billing
- `POST /api/billing/checkout` — merchant-auth'd, creates a Stripe Checkout session for a given plan.
- `POST /api/billing/portal` — creates a Stripe Customer Portal session.
- `POST /api/webhooks/stripe` — Stripe webhook handler. Verify signature with `STRIPE_WEBHOOK_SECRET`. Update `merchants.plan` on `checkout.session.completed` / `customer.subscription.updated` / `customer.subscription.deleted`.

## Conventions
- All responses: `{ data: ... }` on success, `{ error: { message, code } }` on failure.
- Validate every request body with a zod schema in `/lib/validators` — do not inline ad-hoc validation in route handlers.
- Every merchant-auth'd route must 401 if there's no session and 403 if the session's merchant doesn't own the requested resource — write both cases into any tests.
