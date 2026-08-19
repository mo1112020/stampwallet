# Legal / Compliance -- State

## Policy Baseline
`.company/steering/policies.md` covers security, quality, cost management, dev process, and compliance policy (GDPR/CCPA mentioned generically, OSS license compliance, cookie consent where required).

## Points Worth a Legal Review (flagged from codebase facts, not conclusions)
- **Data residency**: Supabase region is `eu-west-1`, Vercel functions pinned to `dub1` (Dublin) -- worth confirming this matches any data-residency commitments made to MENA/GCC merchants/customers (`.company/VISION.md` target market)
- **Payments**: Stripe is the billing processor (Paddle was evaluated and dropped) -- confirm merchant terms of service / DPA coverage matches actual Stripe usage
- **Wallet passes**: Apple/Google Wallet integrations involve merchant + customer data flowing through Apple/Google infrastructure -- confirm privacy policy covers this explicitly
- No privacy policy or terms-of-service content found in this codebase snapshot -- if these exist, confirm location; if not, this is an open item

## Company Registration (confirmed by CEO, 2026-08-19)
**No company legally registered yet.** This is why Stripe billing stays in test mode for now -- live Stripe payments require business verification (legal entity, banking, tax ID), which isn't possible without registration. Not a blocker to pre-launch dev work, but is the actual gate on ever taking real payments, not just a Stripe setting. Worth deciding jurisdiction/entity type sooner rather than later given the MENA/GCC target market + EU-hosted data (Supabase eu-west-1).

## Privacy Policy & Terms of Service -- Drafted and Published 2026-08-19
Bilingual (en/ar) drafts live at `/privacy` and `/terms`, linked from the footer (which previously had the labels but no actual links -- a real gap, now fixed). Grounded in the actual codebase's data flows: Supabase (EU/Ireland hosting), Stripe billing, Resend email, Apple/Google Wallet data sharing, no customer login/account, cascading delete on account deletion, no third-party analytics cookies currently in use. The ToS's governing-law/jurisdiction section is explicitly left as a placeholder pending company registration rather than guessed.

**These are drafts, not lawyer-reviewed.** Treat as a starting point that closes the "nothing published at all" gap, not as final legal sign-off -- have an actual lawyer review before scaling past a handful of merchants, and definitely before company registration locks in a jurisdiction (the ToS placeholder will need real content then).

## Gaps -- Ask Ahmed
- Target jurisdiction/entity type for registration, and rough timeline
- Lawyer review of the new privacy policy / ToS drafts
