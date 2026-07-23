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
- Rate limit: reject repeat `award` scans on the same `pass_id` within a short window (e.g. 10 seconds) to prevent double-scans; make the window configurable.

## Wallet
- `GET /api/wallet/apple/[passId]` — generates and streams a signed `.pkpass` file for the given pass (used by our own "Add to Apple Wallet" button, not by Apple's protocol).
- `GET /api/wallet/google/[passId]` — generates the "Add to Google Wallet" JWT/link for the given pass.
- `webServiceURL` in every generated pass points at `/api/wallet/apple`. Apple's own PassKit Web Service protocol appends `v1/...` to that, implemented under `app/api/wallet/apple/v1/`:
  - `POST /api/wallet/apple/v1/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]/[serialNumber]` — device registers for push updates. Auth'd via `Authorization: ApplePass <token>` checked against `customer_progress.apple_auth_token`. Writes to `apple_device_registrations`.
  - `DELETE` same path — device unregisters.
  - `GET /api/wallet/apple/v1/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]?passesUpdatedSince=` — returns serial numbers of that device's passes updated since the given tag.
  - `GET /api/wallet/apple/v1/passes/[passTypeIdentifier]/[serialNumber]` — returns the current signed `.pkpass` (or 304 via `If-Modified-Since`).
  - `POST /api/wallet/apple/v1/log` — receives Apple's client-side error logs.
  - See `05-wallet-integration.md` for the full push flow.

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
