# WalletOS Keyword / Topic Cluster Strategy

**Prepared for:** walletos.online content architecture (blog does not exist yet -- 0 posts, no `/blog` route in the codebase today)
**Date:** 2026-08-26
**Companion file:** `cluster-plan.json` in this same directory (machine-readable, same data, for the content calendar / execution pipeline)
**Sources read first (not re-derived):** `.company/departments/marketing/STATE.md`, `.company/VISION.md`

## Method note (read before the data)

No DataForSEO/Ahrefs/SEMrush/Keyword-Planner connector was available this session, so:
- **SERP overlap** was gathered via ~20 WebSearch queries (English + Arabic) and is a **domain-overlap-weighted approximation**, not exact top-10 URL intersection. Full 40x40 pairwise comparison was not run; per the skill's own optimization rules, keywords were pre-grouped by intent/head-term and only boundary pairs were spot-checked (see the representative pairs table below). This is directionally reliable for architecture decisions, not precise enough for volume forecasting.
- **Search volume** is qualitative (High/Medium/Low/Regional-only), inferred from SERP crowding and query-pattern frequency, not measured numbers. Once GA4 has real data and Search Console is verified, re-run this with actual query/impression data before locking a content calendar's ordering.
- Existing indexed pages (home, features + subpages, industries, pricing, faq, support) are treated as already covering their head terms and are **not** re-proposed as hub targets.

---

## 1. Competitive landscape (why this matters for prioritization)

The digital wallet-pass loyalty niche is **more crowded than it looks** for a brand-new domain. Across nearly every English-language query tested, the same 6-8 competitors repeat:

**Dominant English wallet-pass specialists:** Stamp Me, Loopy Loyalty, BonusQR, PassKit, FaveCard, LoyaltyPass, Loop.fans, Cuppacard -- these own the head terms ("digital loyalty card app," "digital stamp card app") *and* most of the classic vertical pages (coffee shop, salon, gym, barbershop, restaurant). Stamp Me alone surfaced in 9 of the 12 English queries tested.

Of the specific competitors named in the brief: **Loyverse** is POS-first with loyalty as a bolt-on (not a wallet-pass specialist and shows up mainly on POS-comparison SERPs, not loyalty-app SERPs). **Fivestars** and **Punchh** are US-focused, app-download-based models -- structurally different from WalletOS's no-app-download pitch, and didn't surface at all in the wallet-pass-specific searches run. **LoyaltyLion** is Shopify/e-commerce loyalty, a different buyer entirely. **Preferred Patron** and **Stamp Me** did surface repeatedly and are the more relevant direct competitors to watch.

**MENA-region players confirmed by research (not just the brief's guesses):** Resal / رسال (resal.me, Jeddah-based, ~$9M raised, the largest MENA loyalty/rewards platform -- but broader "loyalty & payments" not wallet-pass-first), Waya / وايا (trywaya.com, café/small-store loyalty with real Arabic blog content), Loltux (Saudi cafes/restaurants), OneCup (onecup.cc, bilingual Apple/Google Wallet cards), btaqa.io (Arabic loyalty-guide content).

**The one finding that should drive the whole strategy:** none of the dominant English wallet-pass specialists appeared anywhere in the Arabic-language SERPs tested. The Arabic results are owned by a thinner, more general set of MENA loyalty/POS players who are not producing focused wallet-pass educational content. That is WalletOS's clearest whitespace -- more than any English vertical gap.

---

## 2. Keyword universe (expanded, intent-classified)

~45 variants collected across English + Arabic, generic category, vertical, comparison/alternative, and MENA-specific terms. Navigational terms (competitor brand names used as pure lookups, e.g. "loopyloyalty.com login") were excluded per methodology. Grouped by cluster below rather than as a flat list, since that's the actionable form.

| Intent | Signal | Included in clustering? |
|---|---|---|
| Informational | how, what, explained, guide, works | Yes -- majority of the set |
| Commercial | vs, best, alternative, comparison | Yes -- comparison/alternative terms |
| Transactional | pricing, sign up, free trial | Partially -- pricing intent is already served by the existing `/pricing` page; not re-targeted with new blog content |
| Navigational | competitor brand + "login"/"app download" | Excluded |

---

## 3. SERP overlap findings (representative pairs)

Full matrix is in `cluster-plan.json` under `serp_matrix_representative_pairs`. Highlights that actually changed the architecture:

| Pair | Approx. overlap | Threshold action | What it means |
|---|---|---|---|
| "digital loyalty card app" vs "digital stamp card app" | 1 | Separate | Surprisingly little shared SERP despite similar text -- validates the SERP-first methodology over text similarity |
| "stamp card vs points program" vs "points vs stamps loyalty program" | 8 | **Same post** | Merged into one comparison spoke (don't publish both) |
| "apple wallet loyalty card" vs "google wallet loyalty card" | 6 | **Same post** | Folded into one combined explainer spoke rather than two near-duplicate pages |
| "coffee shop loyalty app" vs "salon loyalty program app" | 2 | Interlink only | Confirms both are saturated by Stamp Me/Loopy -- deprioritized as new content targets |
| "car wash loyalty program app" vs "pet grooming loyalty card app" | 1 | Separate | Different, thinner competitor sets -- justifies two distinct vertical spokes |
| "wallet push notification marketing" vs "apple wallet loyalty card" | 2 | Interlink only | Wallet-marketing/engagement content is its own topic, not a mechanics sub-page |
| "بطاقة ولاء رقمية" vs "digital loyalty card app" | 0 | Separate | **Zero domain overlap** -- Arabic and English are functionally independent SERPs; bilingual content pairs are not cannibalization |
| "بطاقة ولاء رقمية للمقاهي" vs "برنامج ولاء رقمي للمقاهي" | 7 | **Same post** | Arabic query variants consolidate more than English -- fewer, broader Arabic posts outperform fragmenting into many near-duplicate AR pages |
| "loyverse alternative" vs "fivestars alternative" | 5 | Same cluster | Real cluster exists, but ranking requires the brand to already be listed on Capterra/G2/SaaSHub -- not true yet, so this cluster is intentionally **not** in Phase 1 |

---

## 4. Recommended architecture: one pillar, three clusters, 11 posts

**Why not chase the head term as the pillar:** "digital loyalty card app" / "customer loyalty program software" are owned by 6-8 established niche SaaS competitors with years of dedicated content. A zero-authority domain publishing one more "ultimate guide to loyalty apps" post has no realistic path to page 1 in the near term. Instead, the pillar is framed as a genuine explainer of the wallet-pass mechanic itself -- a real content gap even among the incumbents -- which still captures the broad top-of-funnel intent without fighting the most saturated exact phrase.

```
                                        [Cluster A: Program Mechanics]
                                     Stamp vs Points vs Reward Journey
                                     Reward Journey / Tiered Explained
                                     Wallet Cards, No App Download
                                              |
[Cluster B: Underserved Verticals] -- [PILLAR: How Digital Loyalty  ] -- [Cluster C: MENA / Bilingual]
  Car Wash                             Cards Work (Apple/Google Wallet)    دليل بطاقة الولاء الرقمية (AR)
  Pet Grooming                                                              الفرق بين الأختام والنقاط (AR)
  Clinic & Pharmacy                                                         Wallet Push Notifications (GCC)
  Independent Hotel
```

### Pillar

| Field | Value |
|---|---|
| Title | How Digital Loyalty Cards Work: The Merchant's Guide to Apple Wallet & Google Wallet Loyalty Programs |
| Keyword | how digital loyalty cards work (apple wallet / google wallet) |
| Intent | Informational (broad) |
| Template | ultimate-guide |
| Word count | 3,200 |
| URL | `/en/blog/digital-loyalty-cards-guide` |
| EN/AR | Needs a genuine Arabic counterpart (not a translation) -- see Cluster C1 |

### Cluster A -- Loyalty Program Mechanics

Maps 1:1 to WalletOS's actual product (stamp / points / reward journey). This cluster does double duty as content marketing and as an implicit product-education/sales page, since most competitors only frame the decision as stamp-vs-points (2-way), not the 3-way decision WalletOS actually offers.

| Post | Keyword | Intent | Template | Words | URL |
|---|---|---|---|---|---|
| Stamp Card vs Points Program vs Reward Journey | stamp card vs points program for small business | Commercial (compare) | comparison | 1,600 | `/en/blog/stamp-card-vs-points-vs-reward-journey` |
| What Is a Reward Journey? Tiered Loyalty Explained | tiered loyalty program steps stages | Informational (concept) | explainer | 1,400 | `/en/blog/reward-journey-tiered-loyalty-explained` |
| No App Required: How Wallet Loyalty Cards Work | apple wallet google wallet loyalty card no app | Informational (concept) | explainer | 1,400 | `/en/blog/wallet-loyalty-cards-no-app-download` |

### Cluster B -- Underserved Vertical Guides

Coffee shops, salons, gyms and barbershops are already saturated (5-9 repeat competitor domains per query) and are already summarized at overview level on the existing `/industries` page -- not worth new blog investment right now. Car wash, pet grooming, clinic/pharmacy, and independent hotel are all in WalletOS's stated target market but showed **measurably thinner, more fragmented competition** (2-4 domains, no single dominant incumbent) -- a realistic near-term ranking opportunity.

| Post | Keyword | Intent | Template | Words | URL |
|---|---|---|---|---|---|
| Car Wash Loyalty Program | car wash loyalty program app digital stamp card | Informational (how) | how-to | 1,400 | `/en/blog/car-wash-loyalty-program` |
| Pet Shop & Grooming Loyalty Card App | pet grooming shop loyalty card app | Informational (how) | how-to | 1,300 | `/en/blog/pet-grooming-loyalty-card` |
| Clinic & Pharmacy Customer Loyalty Programs | clinic pharmacy customer loyalty program app | Informational (how) | how-to | 1,300 | `/en/blog/clinic-pharmacy-loyalty-program` |
| Small Hotel & Guesthouse Guest Loyalty | independent hotel guest loyalty program app | Informational (how) | how-to | 1,300 | `/en/blog/independent-hotel-loyalty-program` |

*Caveat:* clinic/pharmacy and hotel are genuine whitespace but **unconfirmed demand** -- treat as demand-testing pages (cheap to produce, watch GA4/GSC impressions before doubling down on the vertical).

### Cluster C -- MENA / Bilingual Loyalty & Wallet Marketing

The strongest strategic bet in this plan. None of the dominant English competitors show up in Arabic search results at all. These three posts must be **written natively in Arabic for GCC business vocabulary and search behavior**, not translated from Cluster A/B content -- see Section 5.

| Post | Keyword (AR) | Intent | Template | Words | URL |
|---|---|---|---|---|---|
| دليل بطاقة الولاء الرقمية لتجار السعودية والإمارات | بطاقة ولاء رقمية لمحفظة آبل وجوجل | Informational (concept) | explainer | 1,700 | `/ar/blog/digital-loyalty-card-guide-mena` |
| الفرق بين بطاقة الأختام ونظام نقاط الولاء | الفرق بين بطاقة الأختام ونظام النقاط | Commercial (compare) | comparison | 1,400 | `/ar/blog/stamp-vs-points-loyalty-arabic` |
| Wallet Push Notifications for GCC Merchants | wallet push notifications loyalty marketing GCC | Informational/Commercial | listicle | 1,500 | `/en/blog/wallet-push-notifications-gcc-merchants` |

*Note on the third post:* wallet push notifications is a genuinely novel angle (no competitor overlap found at all: loyoly/coupontools/brevo/yotpo vs. the loyalty-app competitor set are two different SERPs). It's listed in English first because the strongest hook is a hard stat (>85% wallet open rate vs ~9% email) that reads as a global proof point; a localized Arabic companion is a good Phase 2 addition once bilingual traffic split is visible in GA4.

---

## 5. Flag: English-only-viable vs. needs-genuine-Arabic-treatment

| Post | Verdict |
|---|---|
| Pillar (how wallet cards work) | **Needs genuine AR treatment** -- paired with C1, not translated |
| A1 Stamp vs Points vs Reward Journey | **Needs genuine AR treatment** -- paired with C2. Arabic search behavior consolidates this into one broader "نظام الولاء" query, not a head-to-head comparison phrase, so the AR version should not mirror the EN structure |
| A2 Reward Journey / Tiered explainer | English-only viable for now -- no evidence of Arabic demand for "tiered"/"steps" loyalty as its own concept; fold the idea into C1 rather than publishing a standalone AR post |
| A3 Wallet cards, no app download | English-only viable for now -- its Arabic equivalent is effectively delivered by C1; don't duplicate |
| B1 Car wash | English-only first; car washes are a very common GCC SMB category, so a real (not translated) Arabic version is a good Phase 2 slot |
| B2 Pet grooming | English-only; no evidence of Arabic demand yet |
| B3 Clinic/pharmacy | **Needs genuine AR treatment**, but flagged as unconfirmed demand -- the Arabic SERP test for this vertical returned no dedicated loyalty content at all (just general business/regulatory results), which could mean real whitespace or could mean the query itself isn't searched. Test cheaply, don't over-invest before data. |
| B4 Independent hotel | English-only; competitive set (Preferred Patron, Stash Hotel Rewards) is North-America-centric -- differentiate on "no PMS integration" rather than adding an unconfirmed Arabic version yet |
| C1 دليل بطاقة الولاء الرقمية | **This IS the genuine Arabic pillar counterpart** -- native GCC merchant vocabulary ("بطاقة أختام", "محفظة رقمية"), not a literal translation |
| C2 الفرق بين الأختام والنقاط | **This IS the genuine Arabic treatment** of A1's topic -- written natively, hreflang-paired to A1, not translated from it |
| C3 Wallet push notifications | English-first; Arabic companion is Phase 2 |

**Bottom line:** genuine Arabic-market content is not "translate the English cluster" -- it is its own smaller, more consolidated cluster (C1 + C2 cover ground that takes 3 English posts to cover, per the SERP consolidation finding in Section 3) plus selective vertical expansion once demand is confirmed.

---

## 6. Internal link matrix

Full JSON adjacency list is in `cluster-plan.json` (`links` array, 34 links total: 12 mandatory pillar<->spoke pairs, 20 recommended sibling links, 3 optional cross-cluster/hreflang links). Rules applied:

- Every spoke links to the pillar (mandatory) and the pillar links to every spoke (mandatory) -- 22 mandatory links covering all 11 posts.
- Every post gets 2 recommended sibling links within its cluster, so every spoke has >=3 total incoming links (1 pillar + 2 siblings), satisfying the minimum-incoming-links rule with zero orphan pages.
- 3 optional cross-cluster links connect the EN mechanics posts to their AR counterparts (hreflang-style topical bridges, e.g. A1 -> C2, pillar/A3 -> C1) plus one bridge from the car wash vertical post to the wallet-push-notifications post.
- No two posts share a primary keyword (cannibalization check: 0 conflicts). EN/AR pairs covering similar concepts are explicitly *not* cannibalization -- confirmed 0 domain overlap between `بطاقة ولاء رقمية` and `digital loyalty card app` SERPs, and they sit on separate `/en/*` / `/ar/*` locale trees already in use across the rest of the site.

---

## 7. Pre-delivery validation

- [x] No two posts share the same primary keyword
- [x] Every spoke has >=3 incoming internal links planned (pillar + 2 siblings)
- [x] Every spoke links to the pillar (mandatory)
- [x] Pillar links to every spoke (mandatory)
- [x] No orphan pages
- [x] Template selection matches intent classification
- [x] Word counts in spec (pillar 3,200 within 2,500-4,000; spokes 1,300-1,700 within 1,200-1,800)
- [x] 3 clusters (within 2-5), 3-4 posts per cluster (within 2-4), 11 posts total (within 5-21)
- [x] SERP overlap data supports groupings -- vertical/mechanic spokes within a cluster share head term + intent (skip-rule assumption of 4-6 overlap applied per methodology), boundary pairs spot-checked directly (Section 3)

---

## 8. Prerequisite before any of this ships

There is no `/blog` route in the codebase today (`app/[locale]/(marketing)/` currently has home, about, faq, features, industries, pricing, support, updates only). Before Post 1 can go live, Dev needs to stand up a bilingual `/en/blog/[slug]` + `/ar/blog/[slug]` route with next-intl locale handling, matching the existing site's routing pattern -- this is a blocking dependency, not a content task.

---

## First 5 pages to build (priority order)

1. **Pillar -- "How Digital Loyalty Cards Work: Apple Wallet & Google Wallet Explained"** (`/en/blog/digital-loyalty-cards-guide`). Must exist before any spoke can link to it; also doubles as top-of-funnel product education for visitors who don't yet understand the wallet-pass model.
2. **"Stamp Card vs Points Program vs Reward Journey: Which Loyalty Model Fits Your Business?"** (`/en/blog/stamp-card-vs-points-vs-reward-journey`). Directly mirrors WalletOS's 3 actual product types -- content marketing that's also a soft product pitch, and a genuine 3-way-comparison gap most competitors don't cover.
3. **"دليل بطاقة الولاء الرقمية لتجار السعودية والإمارات"** (`/ar/blog/digital-loyalty-card-guide-mena`). The single strongest whitespace found in this research -- zero English competitors present in Arabic SERPs. Establishes the bilingual foundation early rather than as an afterthought.
4. **"Car Wash Loyalty Program: Digital Stamp Cards Customers Actually Use"** (`/en/blog/car-wash-loyalty-program`). Best of the underserved-vertical opportunities: real target-market fit, thin competition, common GCC SMB category too (good future AR candidate).
5. **"الفرق بين بطاقة الأختام الرقمية ونظام نقاط الولاء"** (`/ar/blog/stamp-vs-points-loyalty-arabic`). Locks in the bilingual mechanics pairing early (native Arabic treatment of post #2, not a translation) so the pillar has both its EN and AR spoke pairs live from the start.

*Deliberately excluded from the first 5, and why:* pet grooming / clinic-pharmacy / hotel verticals (real but lower-confidence demand -- sequence after GA4 has data on posts 1-5), the "reward journey" and "no app download" mechanics spokes (useful depth but not launch-critical once the pillar covers the basics), wallet push notifications (strong content but works better as a mid-funnel piece once there's an audience to distribute it to), and any "[Competitor] alternative" page (SERP is dominated by review directories like Capterra/G2 -- WalletOS isn't listed on those yet, so ranking there isn't realistic until that's fixed first).
