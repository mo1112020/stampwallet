# Marketing / Growth -- State

## Current Marketing Site (`app/[locale]/(marketing)/`)
Pages live: home, about, faq, features, industries, pricing, support, updates. Bilingual (en/ar) via `next-intl`, hero copy per `messages/en.json`: "Turn casual guests into regulars."

## Target Market (from `.company/VISION.md`)
Coffee shops, bakeries, barbers, salons, gyms, restaurants, car washes, pet shops, clinics, pharmacies, hotels -- MENA/GCC first, expandable globally, bilingual Arabic/English.

## Content Tone
Merchant-facing: direct, benefit-oriented. See `.company/steering/brand.md` for full brand direction.

## Gaps -- No Evidence Found in Codebase
- No blog/content-engine infrastructure (the framework's original Content Engine and Publisher agents were removed as out of scope for WalletOS -- confirm this is correct if content marketing becomes a priority later)
- No current campaign history, ad spend, or channel performance data -- ask Ahmed if any paid channels are live today

## Google Analytics 4 -- Wired 2026-08-19, Awaiting a Measurement ID
CEO asked to start marketing with analytics first (matches the CMO recommendation: you can't know if a channel works without measurement in place). `@next/third-parties`' `<GoogleAnalytics>` added to the root layout, gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID` -- graceful no-op until set, same pattern as WhatsApp/wallet credentials. Privacy Policy (en/ar) updated to disclose GA's cookies and add it as a data-sharing processor, so this doesn't repeat the "coming soon" stale-disclosure bug found in the Phase 6 audit.

**Not active yet** -- needs a real GA4 property. Only the CEO can create one (requires his own Google account): create a GA4 property + web data stream at analytics.google.com, then hand over the Measurement ID (`G-XXXXXXX`). Once set in Vercel production env + redeployed, analytics starts flowing immediately.

Recommended next marketing moves (given 0 merchants, no ad budget, self-serve motion): founder-led direct outreach to a small number of local target businesses for free early access, and short demo-video content (the "tap to add to wallet" moment) over blog/SEO content. Paid ads hold until there's real traffic data + a few live merchants to point ad creative at -- also gated by the framework's own hypothesis-validation rule for new ad channels.
