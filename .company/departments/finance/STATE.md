# Finance -- State

## Billing Infrastructure (confirmed in code)
Stripe integration live (`lib/billing/plans.ts`, `016_stripe_billing.sql`). Paddle was evaluated first and replaced by Stripe (`015_paddle_billing.sql` -> `016_stripe_billing.sql`). Billing-enforcement cron runs daily at 11am UTC (`vercel.json`).

## Pricing Tiers (live in code)
- Free: 1 program, 100 customers
- Starter: $29-290/mo range
- Pro: $79-790/mo range
- Enterprise: contact sales, unlimited

## AI Operations Budget
$200/month, $50/item auto-approve limit (`.company/steering/permissions.md`).

## Current Financials (confirmed by CEO, 2026-08)
- Merchant/customer count: 0 (pre-launch)
- MRR: $0.3 (as reported -- flag to Ahmed if this should read $0 given zero merchants)
- No external funding -- bootstrapped, solo founder. Default to low-cost/free infrastructure in every recommendation.
- Stripe: staying in **test mode** deliberately, not just "not live yet" -- live payments require business verification, which needs a registered company (none yet, see `.company/departments/legal/STATE.md`). Billing enforcement code exists (`016_stripe_billing.sql`, `vercel.json` billing-enforcement cron) and is being verified end-to-end in test mode; the switch to live is an env-var swap once the company is registered, not a code change.
