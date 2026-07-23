# Database Schema (Supabase / Postgres)

All tables use `uuid` primary keys (`gen_random_uuid()`). All tables have `created_at` / `updated_at` timestamps (default `now()`, updated via trigger).

## `merchants`
| column | type | notes |
|---|---|---|
| id | uuid | PK, = `auth.users.id` |
| business_name | text | |
| industry | text | e.g. "coffee_shop", "barber", "gym" — free-form for now, enum later |
| logo_url | text | Supabase Storage path |
| brand_color_primary | text | hex |
| brand_color_secondary | text | hex |
| plan | text | enum: free / starter / pro / enterprise |
| stripe_customer_id | text | nullable |
| locale_default | text | "en" or "ar" |
| currency | text | nullable, migration 008 — opt-in, powers the analytics revenue-impact KPI. Editing UI is Phase 6 (Settings); analytics (Phase 5) just reads it and hides the KPI when null. |
| average_order_value | numeric | nullable, migration 008 — reserved for future ROI calculations, not yet consumed |
| timezone | text | migration 009, default `'UTC'` — editable in Settings, used by Phase 8's campaign scheduling later |
| notification_prefs | jsonb | migration 009, default `{}` — preference toggles (`reward_unlocked`/`birthday`/`expiring_reward`/`inactive_customer`), persisted now but not yet consumed by an actual send (Phase 8) |

## `loyalty_programs`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| merchant_id | uuid | FK → merchants.id |
| name | text | e.g. "Coffee Club" |
| type | text | enum: `stamp` \| `points` \| `steps` |
| is_active | boolean | default true |
| config | jsonb | shape depends on `type`, see below |

**`config` shape by type:**
```jsonc
// stamp
{ "stamps_required": 10, "reward_description": "Free coffee", "icon": "☕" }

// points
{ "points_per_reward": 1000, "reward_description": "Free perfume", "points_label": "pts" }

// steps
{
  "stages": [
    { "key": "welcome", "label": "Welcome Gift", "threshold": 0 },
    { "key": "free_drink", "label": "Free Drink", "threshold": 1 },
    { "key": "discount", "label": "10% Discount", "threshold": 10 },
    { "key": "premium_gift", "label": "Premium Gift", "threshold": 20 },
    { "key": "vip", "label": "VIP Member", "threshold": 30 }
  ]
}
```
Every type also accepts a common set of optional `CardAppearance` keys (colors, background image, join-page config, and as of Phase 5 an optional `reward_value` number — the dollar value of one reward, used by the analytics revenue-impact KPI alongside `merchants.currency`; no schema change needed since `config` is jsonb).

## `customers`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| merchant_id | uuid | FK — a customer record is scoped to one merchant (a person enrolling with two merchants = two rows) |
| name | text | nullable, collected optionally at signup |
| phone | text | nullable — used for wallet pass push registration / notifications |
| email | text | nullable |

## `customer_progress`
One row per customer-per-program enrollment.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| customer_id | uuid | FK → customers.id |
| program_id | uuid | FK → loyalty_programs.id |
| pass_id | uuid | unique, embedded in the wallet pass QR code — this is the "public key" for the pass |
| progress | jsonb | shape depends on program type, see below |
| apple_push_token | text | nullable, set when pass registers for updates |
| apple_auth_token | text | per-pass secret; PassKit web service `Authorization: ApplePass <token>` header, also required as a `?token=` query param on the direct `.pkpass` download route |
| google_object_id | text | nullable |
| google_auth_token | text | per-pass secret; required as a `?token=` query param on the Google Wallet save-link route, same purpose as `apple_auth_token` |

## `apple_device_registrations`
One row per (device, pass) the Apple PassKit web service protocol has registered for push updates — a pass can be added on multiple devices.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| device_library_identifier | text | Apple's device identifier |
| pass_type_identifier | text | |
| serial_number | uuid | FK → customer_progress.pass_id |
| push_token | text | APNs push token |

Service-role only (RLS enabled, no policies) — accessed exclusively by the PassKit web service routes under `app/api/wallet/apple/v1/`.

## `rate_limits`
Postgres-backed replacement for an in-process rate limiter (which doesn't work across serverless instances). One row per rate-limit key (e.g. `scan:award:<pass_id>`, `enroll:<ip>`), checked/updated atomically via the `check_rate_limit(key, window_ms)` function. Service-role only (RLS enabled, no policies) — see `lib/rate-limit.ts`.

**`progress` shape by type:**
```jsonc
// stamp
{ "stamps_collected": 4 }

// points
{ "points": 560 }

// steps
{ "current_value": 7, "completed_stage_keys": ["welcome", "free_drink"] }
```

## `scan_events`
Audit log — every scan, whether it awarded progress or was rejected.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| customer_progress_id | uuid | FK |
| scanned_by | uuid | the acting user's `auth.uid()` — either the merchant owner (`merchants.id`) or a staff member (`staff_accounts.user_id`), see `staff_accounts` below |
| delta | jsonb | what changed, e.g. `{ "stamps_added": 1 }` |
| resulted_in_reward | boolean | |

## `redemptions`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| customer_progress_id | uuid | FK |
| reward_description | text | snapshot at time of redemption |
| redeemed_at | timestamp | |

## `staff_accounts` (migration 005)
Non-owner team members. The merchant (`merchants.id = auth.users.id`) stays the implicit "owner" — this table only holds staff.

| column | type | notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → auth.users.id, unique — the staff member's own login, created via `auth.admin.inviteUserByEmail` |
| merchant_id | uuid | FK → merchants.id |
| role | text | enum: `admin` \| `manager` \| `staff` |
| status | text | enum: `invited` \| `active` \| `revoked` — flips `invited` → `active` on first authenticated request (see `requireSession()` in `lib/api.ts`) |
| invited_email | text | |

## Row Level Security (RLS)
Enable RLS on every merchant-scoped table. Core policy pattern:
```sql
create policy "merchants access own data"
on loyalty_programs
for all
using (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id));
```
`is_active_staff_of(merchant_id)` (migration 005) is a `SECURITY DEFINER` function checking `staff_accounts` — using a function rather than an inline subquery avoids recursive RLS evaluation when the check itself needs to read a table that also has RLS. Applied to `merchants` (staff get read-only), `loyalty_programs`, `customers`, `customer_progress` (via join to program → merchant), `scan_events` (read via merchant/staff, write requires `scanned_by = auth.uid()`), and `redemptions`. RLS here only controls row *visibility* — per-action authorization (can this role redeem a reward, invite staff, etc.) is enforced in application code, see `01-architecture.md`'s "Staff accounts & roles" note.

The public `/pass/[passId]` page and wallet webhook endpoints must use the Supabase **service role key** server-side (never the anon key) since they intentionally bypass merchant auth to look up a pass by its public `pass_id`.

## Indexes to add
- `customer_progress.pass_id` (unique, already implied — used on every scan lookup)
- `loyalty_programs.merchant_id`
- `customer_progress.program_id`
- `scan_events.customer_progress_id`

## Open Question for Ahmed
Should a customer be able to enroll in multiple programs from the *same* merchant (e.g. a coffee shop's stamp card AND a separate VIP steps program)? Current schema supports this naturally (one `customer_progress` row per program), but confirm before building the enrollment UI so it doesn't need reworking.
