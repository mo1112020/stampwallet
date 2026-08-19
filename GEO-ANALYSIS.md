# WalletOS — GEO / AI Search Readiness Analysis

**Site analyzed:** https://www.walletos.online (source: this repo, confirmed against the live deployment)
**Date:** 2026-08-15
**Method:** Source code audit (`app/`, `messages/en.json`, `components/marketing/`) + live fetch of `robots.txt`, `sitemap.xml`, and rendered homepage HTML.

## GEO Readiness Score: 32/100

| Criterion | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 40/100 | 10.0 |
| Structural Readability | 20% | 45/100 | 9.0 |
| Multi-Modal Content | 15% | 55/100 | 8.25 |
| Authority & Brand Signals | 20% | 10/100 | 2.0 |
| Technical Accessibility | 20% | 15/100 | 3.0 |
| **Total** | | | **32.25 ≈ 32/100** |

The single dominant factor: **most major AI crawlers are blocked from reading the site at all**, at the infrastructure level, independent of anything in this codebase. Everything else on this list is worth fixing, but none of it matters until that's addressed.

---

## 1. AI Crawler Access Status — CRITICAL

The app's own `app/robots.ts` is permissive (`Allow: /` for `userAgent: "*"`, disallowing only `/api/`, `/dashboard/`, `/scan-app/`, `/auth/`, `/pass/`). **That is not what's actually served in production.** Cloudflare is injecting a completely different, much stricter `robots.txt` at the edge (confirmed via `curl https://walletos.online/robots.txt`) — this is Cloudflare's "AI Crawl Control" / Content Signals feature, almost certainly turned on unintentionally at the zone level:

```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

User-agent: Amazonbot          → Disallow: /
User-agent: Applebot-Extended  → Disallow: /
User-agent: Bytespider         → Disallow: /
User-agent: CCBot              → Disallow: /
User-agent: ClaudeBot          → Disallow: /
User-agent: CloudflareBrowserRenderingCrawler → Disallow: /
User-agent: Google-Extended    → Disallow: /
User-agent: GPTBot             → Disallow: /
User-agent: meta-externalagent → Disallow: /
```

| Crawler | Status | Impact |
|---|---|---|
| **ClaudeBot** | 🔴 Blocked | Claude cannot crawl or cite this site at all, for training or live answers |
| **GPTBot** | 🔴 Blocked | Excluded from OpenAI's training crawl |
| **Google-Extended** | 🔴 Blocked | Excluded from Gemini/AI-feature training — note: this is a *separate* signal from classic Googlebot (see below) |
| **Applebot-Extended** | 🔴 Blocked | Excluded from Apple Intelligence summarization |
| **meta-externalagent** | 🔴 Blocked | Excluded from Meta AI |
| **Amazonbot, Bytespider, CCBot** | 🔴 Blocked | Excluded from Amazon/TikTok AI and the Common Crawl dataset several open models train on |
| **OAI-SearchBot / ChatGPT-User** | 🟢 Not blocked | Not named individually — falls under the permissive wildcard rule. ChatGPT's *live* web-search citation feature (distinct from GPTBot training) is technically still able to crawl this site |
| **PerplexityBot** | 🟢 Not blocked | Same — falls under the wildcard `Allow: /` |
| **Googlebot / Bingbot** | 🟢 Not blocked | Classic search indexing is unaffected, so Google AI Overviews grounding via the regular Search index likely still works even with Google-Extended blocked |

**This is almost certainly not an intentional decision** — it's a common default when Cloudflare's bot-management or "Block AI Scrapers and Crawlers" toggle gets enabled for a zone. Fix: in the Cloudflare dashboard, under the zone's Bots settings (or Security → AI Scrapers and Crawlers / Content Signals), explicitly **allow** GPTBot, ClaudeBot, Google-Extended, and Applebot-Extended if AI-search visibility is a goal — the current setup optimizes for the opposite (opting the content *out* of AI training/citation almost entirely for the two most relevant assistants, Claude and ChatGPT-via-training).

## 2. llms.txt Status — Missing

`https://walletos.online/llms.txt` returns a 308 redirect into the locale-routing middleware (i.e., the route doesn't exist — it falls through to whatever catches unmatched paths). No `llms.txt` is present.

**Recommended starter file** (`public/llms.txt`, served automatically by Next.js's public folder — no route code needed):

```
# WalletOS
> Digital loyalty cards for small and medium businesses — customers add a stamp/points card straight to Apple Wallet or Google Wallet, no app to download. Bilingual Arabic and English, built MENA/GCC first.

## Product
- Homepage -> https://www.walletos.online/en: What WalletOS is and how it works
- Features -> https://www.walletos.online/en/features: Full feature list
- Wallet integration -> https://www.walletos.online/en/features/wallet: Apple Wallet / Google Wallet details
- Programs -> https://www.walletos.online/en/features/programs: Stamp, points, and steps loyalty programs
- Pricing -> https://www.walletos.online/en/pricing: Free, Starter, Pro plans
- Industries -> https://www.walletos.online/en/industries: Who it's built for (cafés, salons, gyms, etc.)
- FAQ -> https://www.walletos.online/en/faq: Common questions, answered

## Key facts
- No app download required — cards live natively in Apple Wallet and Google Wallet
- Signup to a live enrollment QR code in under two minutes
- Bilingual Arabic/English, MENA/GCC-first
- Free plan available; paid plans start at Starter
```

## 3. Passage-Level Citability — Weak (40/100)

- The FAQ (`messages/en.json` → `site.faq.items`, 12 Q&A pairs) is the strongest citable content on the site: short, direct, self-contained answers (e.g. *"No. Passes live in Apple Wallet and Google Wallet. Customers add their card in seconds. Nothing to download, no account to create."*). Good raw material, but it's rendered as a client-side accordion (`components/marketing/faq.tsx`) with **no `FAQPage` schema**, and each question is a `<button>`, not a semantic `<h2>`/`<h3>` — so neither AI parsers nor Google's FAQ rich-result eligibility can identify it as structured Q&A content.
- No page on the site has a genuine **134–167 word self-contained answer block** — content is broken into short marketing bullets (1–2 sentences) throughout, which reads well for humans but gives an AI system nothing substantial to quote as a standalone passage beyond the FAQ answers themselves.
- The About page has one good definitional sentence (*"WalletOS helps small and medium businesses launch digital loyalty in minutes"*) but it's not framed as a "What is WalletOS?" answer, and isn't marked up as a definition.
- No statistics, benchmarks, or original data anywhere on the site (expected for a young product site, but it's also the single highest-leverage differentiator available — see Quick Wins).

## 4. Structural Readability — 45/100

- Pages use a real heading hierarchy in most sections (`PageHero` → H1, section titles → H2), which is good.
- FAQ questions are not headings (see above) — the single largest structural fix available on the site.
- No tables anywhere (pricing page in particular is a natural fit — three plans, several dimensions — currently rendered as marketing cards, not a comparison table an AI system could extract cleanly).
- The "How it works" steps (`components/marketing/how-it-works.tsx`, 5 steps on the homepage) render as icon cards, not an ordered `<ol>` list — a missed, easy structural win for a genuinely sequential process.

## 5. Multi-Modal Content — 55/100

- Homepage has a real hero video (wallet-pass demo) and an animated wallet-demo component — good.
- Inner pages (features, industries, infrastructure) rely on icon cards rather than screenshots, diagrams, or video — thinner multi-modal signal the deeper into the site you go.

## 6. Authority & Brand Signals — 10/100 (the second-largest gap after crawler access)

- **Zero external brand presence found**: no LinkedIn, X/Twitter, Instagram, YouTube, Reddit, or Wikipedia links anywhere in the codebase (`components/marketing/footer.tsx` has no social links at all).
- Per the correlation data behind this analysis, YouTube mentions (~0.737) and Reddit presence are the *strongest* predictors of AI-citation likelihood — stronger than backlinks or domain authority by a wide margin. A brand-new product site with zero footprint on either starts from close to zero regardless of on-page optimization.
- No author bylines, no publication/last-updated dates anywhere (not unusual for a SaaS marketing site with no blog, but it does mean there's no freshness signal at all for any page).
- No case studies, customer quotes, testimonials, or third-party validation found on any marketing page.

## 7. Technical Accessibility — 15/100

- **Server-side rendering: good.** This is a Next.js App Router site — every marketing page is a server component (`about/page.tsx`, `page.tsx`, `pricing/page.tsx`, etc. are all `async function ... Page`), so content is present in the initial HTML response, not gated behind client-side JavaScript. The one client component on the marketing site (`FaqSection`, `"use client"` for the accordion interaction) still SSRs its full text content — confirmed via a live fetch, the FAQ answer text is present in the raw HTML even though the UI collapses it visually with CSS.
- **Zero structured data**: confirmed via live fetch — no `application/ld+json` anywhere on the homepage. No `Organization`, `SoftwareApplication`, `FAQPage`, or `WebSite` schema at all.
- **Zero OpenGraph/Twitter Card tags**: confirmed via live fetch — a link to this site shared on any platform (including inside an AI chat response) has no preview image, title, or description to draw on beyond the raw URL.
- **Zero per-page `<title>`/meta description**: confirmed both in source (`grep` for `generateMetadata`/`export const metadata` across `app/` returns only the root layout and the scanner-app layout — no marketing page overrides it) and live (every page shares the identical root-level `<title>WalletOS</title>` and one generic description). The content to differentiate pages doesn't exist yet even in the translation files — `messages/en.json`'s `meta` key only has one global `title`/`tagline` pair, not one per route.
- **No hreflang or canonical tags**: confirmed via live fetch — despite the site being genuinely bilingual (`/en/`, `/ar/` routes via `next-intl`), there's no `hreflang` alternate-language signal connecting the two versions of any page, and no `rel="canonical"` tag (the `walletos.online` → `www.walletos.online` redirect is handled correctly at the network level, but there's no HTML-level backup signal).
- This blocking + tagging gap compounds the crawler-access problem from Section 1: even the AI systems that *can* still reach the site (Perplexity, ChatGPT's live search) get generic, undifferentiated metadata and no structured data to work with once they arrive.

---

## Platform Breakdown

| Platform | Crawl access | Realistic near-term outlook |
|---|---|---|
| **Google AI Overviews** | Googlebot unaffected; Google-Extended blocked | Likely still eligible via the regular Search index (92% of AIO citations come from top-10 organic results per the current data), but classic on-page SEO gaps (no per-page titles/descriptions, no schema) will hold back organic ranking itself, which caps AIO eligibility indirectly |
| **ChatGPT** | GPTBot (training) blocked; OAI-SearchBot/ChatGPT-User not blocked | Live search citation is technically possible, but ChatGPT's citations skew heavily toward Wikipedia (47.9%) and Reddit (11.3%) — zero presence on either caps realistic citation likelihood regardless of crawl access |
| **Perplexity** | Not blocked | Best-positioned of the four platforms to actually crawl and cite this site today, but same brand-presence gap applies (Perplexity draws 46.7% from Reddit) |
| **Claude** | **ClaudeBot fully blocked** | Cannot currently read this site at all, for training or live citation |

---

## Top 5 Highest-Impact Changes

1. **Fix the Cloudflare AI-crawler block** (infra, not code — check the zone's Bots / AI Scrapers settings). This single toggle currently undoes the value of every other fix on this list for Claude and GPT training specifically.
2. **Add per-page metadata** (`generateMetadata` on every marketing page) with distinct, specific titles/descriptions — currently every page on the site is indistinguishable to a search or AI system.
3. **Add `FAQPage` JSON-LD** wrapping the existing 12 FAQ items, and promote each question to a real `<h3>` — the content already exists and is well-written; it just isn't marked up as structured Q&A anywhere.
4. **Add `Organization`/`SoftwareApplication` JSON-LD + OpenGraph tags** sitewide — near-zero engineering cost, closes the "zero structured data" and "no link preview" gaps in one pass.
5. **Establish minimal brand presence** (at least a real LinkedIn company page and a YouTube demo video, linked from the footer) — per the data behind this analysis, this correlates more strongly with AI citation than any on-page change, and the site currently has literally zero footprint on either.

## Schema Recommendations

- `Organization` (sitewide, in the root layout): name, url, logo, `sameAs` array (once social profiles exist).
- `SoftwareApplication` or `Product` (homepage): name, description, `offers` referencing the three plan prices already defined in `lib/billing/plans.ts` (`PLAN_PRICES_USD_CENTS`) — this data already exists in the codebase and just needs to be surfaced as structured data.
- `FAQPage` (faq page + homepage FAQ section): built directly from the existing `site.faq.items` translation keys.
- `BreadcrumbList` (inner pages): low effort given the existing `breadcrumbs` translation namespace already present in `messages/en.json`.

## Content Reformatting Suggestions

- Rewrite the About page's mission sentence as an explicit, quotable definition: *"WalletOS is a digital loyalty platform that lets small and medium businesses give customers a stamp or points card in Apple Wallet or Google Wallet — no app, no signup, added in seconds."* — a single self-contained 30–40 word sentence AI systems can lift directly.
- Turn the pricing page's three plan cards into an actual `<table>` (plan × price × programs × customers × seats) — the same data already exists in `lib/billing/plans.ts`'s `PLAN_LIMITS`, it's just not rendered as comparable structured data on the page.
- Convert the homepage's 5-step "How it works" into a real ordered list (`<ol>`) with each step as a heading — matches "step-by-step content" citability patterns directly.
- Promote each FAQ question from a `<button><span>` to a real `<h3>`, keeping the existing interactive accordion behavior — semantic heading and interactive UI aren't mutually exclusive.
