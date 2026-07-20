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
| google_object_id | text | nullable |

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
| scanned_by | uuid | FK → merchants.id (or a staff-user id if staff accounts are added later) |
| delta | jsonb | what changed, e.g. `{ "stamps_added": 1 }` |
| resulted_in_reward | boolean | |

## `redemptions`
| column | type | notes |
|---|---|---|
| id | uuid | PK |
| customer_progress_id | uuid | FK |
| reward_description | text | snapshot at time of redemption |
| redeemed_at | timestamp | |

## Row Level Security (RLS)
Enable RLS on every merchant-scoped table. Core policy pattern:
```sql
create policy "merchants access own data"
on loyalty_programs
for all
using (merchant_id = auth.uid());
```
Apply the equivalent pattern to `customers`, `customer_progress` (via join to program → merchant), `scan_events`, and `redemptions`. The public `/pass/[passId]` page and wallet webhook endpoints must use the Supabase **service role key** server-side (never the anon key) since they intentionally bypass merchant auth to look up a pass by its public `pass_id`.

## Indexes to add
- `customer_progress.pass_id` (unique, already implied — used on every scan lookup)
- `loyalty_programs.merchant_id`
- `customer_progress.program_id`
- `scan_events.customer_progress_id`

## Open Question for Ahmed
Should a customer be able to enroll in multiple programs from the *same* merchant (e.g. a coffee shop's stamp card AND a separate VIP steps program)? Current schema supports this naturally (one `customer_progress` row per program), but confirm before building the enrollment UI so it doesn't need reworking.
