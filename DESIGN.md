---
name: WalletOS — Stamp & Verdict
description: A counter tally sheet, not a SaaS dashboard — kraft paper, ink, and one rubber-stamp red that marks things rather than decorates them.
colors:
  stamp-red: "#b23a1a"
  stamp-red-soft: "#f3ddd0"
  ink: "#241a12"
  muted-ink: "#7d6b52"
  line: "#cbb489"
  line-strong: "#a88c5c"
  paper-bg: "#ead9bd"
  paper-surface: "#f3e9d8"
  paper-surface-2: "#ead9bd"
  paper-surface-3: "#e0c9a0"
  verdict-green: "#2f7d4f"
typography:
  display:
    fontFamily: "Cairo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Cairo, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Cairo, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Cairo, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "0.04em"
rounded:
  none: "0px"
  pill: "9999px"
  device: "38px"
spacing:
  section-y: "6rem"
  card-p: "1.75rem"
components:
  button-primary:
    backgroundColor: "{colors.stamp-red}"
    textColor: "#fdf6ea"
    rounded: "{rounded.pill}"
    padding: "0 1.25rem"
  card:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.card-p}"
---

# Design System: WalletOS — Stamp & Verdict

## Overview

**Creative North Star: "The Counter Tally Sheet"**

WalletOS's marketing site is redesigned as the thing it replaces: a merchant's hand-marked loyalty card, redrawn as software. Not a SaaS dashboard borrowing gradient-and-glass conventions that could belong to any product — a warm kraft-paper counter surface, ink-black type, and exactly one rubber-stamp red that does the marking. Content doesn't fade in; it gets **stamped**, with a hard punch-in overshoot and a brief ink fill, because that's what this product's own mechanism (a pass that updates instantly, visibly, on scan) actually deserves.

This system currently covers the homepage and the shared marketing chrome (header, footer, cards, CTA band) — those inherit automatically on every marketing page via scoped CSS custom properties. Page-specific layouts beyond the homepage (about, pricing, industries, features) have **not** had a structural redesign pass yet; they currently render with the new colors/type/shapes through inheritance but the old page composition. The dashboard app is untouched and intentionally out of scope — it still runs the original blue/white product-UI tokens.

**Key Characteristics:**
- Warm kraft paper ground, near-black ink, one saturated stamp-red accent — Committed color strategy, not a full rainbow
- Cairo (Arabic + Latin, matched weights, one family) at real display weight — genuinely bilingual, not Latin-primary with Arabic bolted on
- Hard 2px ink borders and solid offset shadows; no blur, no glassmorphism, no gradients
- The signature interaction is a stamp: rotate + scale overshoot + brief ink fill, never a fade

## Colors

Two colors carry almost everything: warm kraft paper as the ground, and one rubber-stamp red as the only accent that means "act" or "this just happened."

### Primary
- **Stamp Red** (`#b23a1a`): buttons, active nav underline, the kicker badge border, ink-stamp fills on state change. Used narrowly and always at full saturation — never tinted down for a "safer" secondary use.

### Secondary
- **Verdict Green** (`#2f7d4f`): reserved exclusively for "approved/ready" moments (a second stamp-ink color, the way a real counter keeps a green "PAID" stamp next to the red one). Not yet wired into a component; reserved for reward-unlocked states.

### Neutral
- **Paper** (`#f3e9d8` surface / `#ead9bd` background / `#e0c9a0` surface-3): the kraft ground and its section-alternation steps.
- **Ink** (`#241a12`): all text, all borders, all hard shadows.
- **Muted Ink** (`#7d6b52`): secondary/supporting copy.
- **Line** (`#cbb489`) / **Line Strong** (`#a88c5c`): hairlines and 2px structural borders respectively.

### Named Rules
**The One Ink Rule.** Exactly one accent color (stamp red) carries action and emphasis anywhere on the page. A second color (verdict green) exists solely for an "approved" state, never as a second general-purpose accent.

## Typography

**Display/Body Font:** Cairo (weights 400–900), with `ui-sans-serif, system-ui` fallback — the same family across Arabic and Latin, not two fonts stitched together.

**Character:** Chunky, confident, stamped. Headings run at 800–900 weight everywhere (enforced globally inside the `.ws-stamp` scope, overriding any lighter utility class) so nothing reads as a soft SaaS headline by accident.

### Hierarchy
- **Display** (900, `clamp(2.25rem, 5vw, 3.75rem)`, 1.15): hero H1 only.
- **Heading** (800, section H2/H3 sizes per Tailwind scale): every other heading — enforced by a scoped `h1,h2,h3,h4 { font-weight: 800 }` rule, not per-component classes.
- **Label** (700, uppercase, 0.04em tracking): the kicker badge, nav active state, footer column headers.
- **Body** (400–600): paragraph copy, muted ink.

### Named Rules
**The No Light Headline Rule.** A heading in this system is never below 800 weight. If a component's markup still carries `font-bold` (700) from before the redesign, the scoped `h2{font-weight:800}` rule already wins on specificity — don't remove the rule to "fix" a visual that isn't broken.

## Layout

Fixed full-width header (4rem mobile / 4.5rem desktop) with a solid 2px ink bottom border — not a floating rounded pill. Content containers stay `max-w-6xl`, sections run generous `py-24`–`py-32` vertical rhythm, matching the pre-existing spacing scale (unchanged from before the redesign). RTL is a first-class layout mode, not a mirrored afterthought: logical properties (`ms-*`, `me-*`, `rtl:` variants) drive every directional style, verified against the live Arabic route.

## Elevation & Depth

No blurred drop shadows anywhere in the new system. Depth is either a hard, fully-opaque offset shadow (a "paper card casting a shadow on the counter") or nothing at all.

### Shadow Vocabulary
- **Panel shadow** (`6px 6px 0 0 var(--ink)` on the wallet-demo phone frame, `8px 8px 0 0 var(--ink)` on the CTA band): the resting state for a small set of deliberately "pinned" surfaces — not a default applied everywhere.
- **Card lift** (`4px 4px 0 0 var(--ink)`, combined with a `-translate-x-0.5 -translate-y-0.5`): the hover state for interactive cards (`IconCard`) — the card visibly lifts off the paper.

### Named Rules (revised after user feedback)
**The Hero Stays Flat Rule.** The hero's proof panel is border-only, no shadow, no tilt. An earlier pass stacked a rotation, taped corners, and a hard offset shadow on it; the user found that read as fussy/craft-kit rather than confident, so the hero specifically stays calm — flat border, no rotation — even though hard shadows remain the system's answer elsewhere (CTA band, phone-demo frame, card hover).

### Named Rules
**The Hard Shadow Rule.** Every shadow in this system is a solid, unblurred offset in the ink color. A blurred/soft shadow (`shadow-xl`, `shadow-lg`, any `blur-*`) is a regression to the previous SaaS system and should not reappear inside `.ws-stamp`.

## Shapes

Flat, hard-edged rectangles by default — `rounded-none` on cards, panels, badges, and the header/footer. Two deliberate, named exceptions:
1. **The phone bezel** (`rounded-[38px]`): it represents a real device, so it stays photorealistic.
2. **Pill buttons** (`rounded-full`, inherited unchanged from the shared `Button` component used across the whole product): kept because a pill reads as a stamp's own oval shape, and because changing it would mean forking the shared button for marketing-only — out of scope for this pass.

Borders are always 2px solid ink or line-strong; never 1px hairlines on a structural element (hairlines are reserved for true dividers, like the how-it-works dashed ledger rule).

## Components

### Buttons
- **Shape:** pill (`rounded-full`, 9999px) — unchanged shared component, colors cascade from the scoped tokens.
- **Primary:** stamp-red background, cream text; entrance uses `.ws-stamp-in` (a stamp-down keyframe: overshoot scale + slight rotate) instead of a fade.
- **Secondary/Outline:** ink border, transparent fill.

### Cards (`IconCard`)
- **Corner style:** `rounded-none`, 2px `line-strong` border.
- **Icon badge:** 2px stamp-red border square (not a soft circle), stamp-red-soft fill.
- **Hover:** lifts (`-translate-x-0.5 -translate-y-0.5`) and gains a hard 4px offset shadow — no color/opacity transition, a physical lift.

### Stamp Badge (signature component)
The small bordered label used as the hero's kicker ("NO APP REQUIRED"): 2px stamp-red border, no fill, uppercase bold label type, animates in with the stamp-down keyframe. No rotation — see The Hero Stays Flat Rule above. Reusable anywhere a short, real claim needs to read as "marked," not decorated.

### Navigation (`MarketingHeader`)
- Fixed, full-width, solid paper background, 2px ink bottom border (not floating/rounded/blurred).
- Active link: plain text weight shift + a 3px stamp-red underline bar, not a filled pill background.
- Wordmark (`LogoStamp`): Cairo 900, slightly rotated (`-rotate-1`), with a faint stamp-red offset "double-strike" duplicate behind the real text — the only place in the system that fakes a print-registration error on purpose.

### How It Works step row (signature component)
A dashed "ledger rule" (`repeating-linear-gradient`, not a solid line) connects five square, ink-bordered step boxes. On scroll into view (desktop only), a GSAP timeline redraws the rule left-to-right (RTL-aware) and each box gets a genuine stamp impression — 8° rotate-in overshoot, scale punch, brief solid ink fill — timed to when the rule reaches it. Plays once; reduced-motion and mobile both fall back to the fully-drawn static state with no animation.

## Do's and Don'ts

### Do:
- **Do** keep every shadow hard and unblurred (`Npx Npx 0 0 var(--ink)`) — see the Hard Shadow Rule.
- **Do** treat Arabic and Latin as one typographic system at equal weight; verify any new marketing surface on the `/ar` route before calling it done.
- **Do** reserve the stamp-down interaction (rotate + scale overshoot + brief ink fill) for moments that mark a real state change (a CTA appearing, a step activating) — not for routine scroll-reveals, which stay on the existing lightweight CSS `Reveal`/`StaggerGroup` components.
- **Do** use exactly one accent (stamp red) for action; verdict green exists only for "approved/ready" states.

### Don't:
- **Don't** round the corners of panels, cards, or badges — `rounded-none` is the default; the phone bezel and pill buttons are the only named exceptions.
- **Don't** introduce gradients, glassmorphism, or `backdrop-blur` — none exist in this system and none should.
- **Don't** apply `.ws-stamp` tokens or components to the dashboard/scan-app — those remain on the original product-UI token set (`--primary` blue, soft rounded cards) until a dashboard redesign pass is explicitly scoped.
- **Don't** treat the current homepage as a finished DESIGN.md audit of the whole marketing site — about/pricing/industries/features still need their own structural pass; only their inherited colors/type/cards are current.
