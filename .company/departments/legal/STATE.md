# Legal / Compliance -- State

## Policy Baseline
`.company/steering/policies.md` covers security, quality, cost management, dev process, and compliance policy (GDPR/CCPA mentioned generically, OSS license compliance, cookie consent where required).

## Points Worth a Legal Review (flagged from codebase facts, not conclusions)
- **Data residency**: Supabase region is `eu-west-1`, Vercel functions pinned to `dub1` (Dublin) -- worth confirming this matches any data-residency commitments made to MENA/GCC merchants/customers (`.company/VISION.md` target market)
- **Payments**: Stripe is the billing processor (Paddle was evaluated and dropped) -- confirm merchant terms of service / DPA coverage matches actual Stripe usage
- **Wallet passes**: Apple/Google Wallet integrations involve merchant + customer data flowing through Apple/Google infrastructure -- confirm privacy policy covers this explicitly
- No privacy policy or terms-of-service content found in this codebase snapshot -- if these exist, confirm location; if not, this is an open item

## Gaps -- Ask Ahmed
- Company's legal entity/jurisdiction (relevant given MENA/GCC target market + EU-hosted data)
- Current status of privacy policy / ToS -- drafted, published, reviewed by a lawyer?
