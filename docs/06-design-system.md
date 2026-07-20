# Design System / Brand Direction

## Principles
- **Simple over feature-rich.** The merchant dashboard should feel like it takes 2 minutes to learn, not 20.
- **Visual, not numeric.** Favor progress bars, filled stamp grids, and stage journeys over raw numbers wherever the customer sees something (matches the source vision doc's "make it visual" theme).
- **Bilingual from day one.** Every customer- and merchant-facing string should go through an i18n layer (e.g. `next-intl`) with `en` and `ar` locales, including full RTL layout support for Arabic — do not bolt this on later.

## Wallet Pass Visuals
- Stamp cards: a grid of circles/icons, filled vs. empty, using the merchant's chosen icon/emoji and brand color.
- Point cards: a progress bar or star-fill visual (per the source doc's `★★★★★☆☆☆☆☆` idea) plus the raw "560 / 1000" as secondary text.
- Steps/journey: a vertical or horizontal path of stage nodes (locked / current / completed states), each with its own icon and label.

## Dashboard UI
- Clean, uncluttered SaaS dashboard aesthetic — avoid dense enterprise-software tables where a simpler card/list view works.
- Merchant brand color picker should live-update the wallet pass preview component in real time (see `components/wallet-preview`).
- Use accessible color contrast — merchants will pick their own brand colors, so validate/warn if a chosen color pair fails WCAG contrast on pass text.

## Component Library
- Use a consistent primitive layer (`/components/ui`) — buttons, inputs, cards, modals, toasts. If using shadcn/ui or similar, keep it consistent across the whole app rather than mixing styles per page.
- Build the `wallet-preview` component early (F2 in `03-mvp-features.md` depends on it) since merchants will use it constantly while configuring a program.

## Content Tone
- Merchant-facing copy: direct, benefit-oriented ("Get customers coming back — not just another wallet card").
- Customer-facing copy (on the pass/enrollment page): warm, simple, low-friction ("Add your card, start earning rewards").

## Open Question for Ahmed
Do you have an existing brand identity for StampWallet (logo, color palette, font) from earlier work, or should the agent propose a fresh visual direction as part of the frontend build?
