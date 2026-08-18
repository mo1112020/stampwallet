# Brand & Design Direction

Source of truth: `docs/06-design-system.md` (principles) + `app/globals.css` (actual tokens shipped in code). This resolves the open brand question originally left in `docs/06-design-system.md` -- a real identity now exists in code.

## Visual Identity (as implemented)
- **Primary color**: `#1f57e7` (light mode), `#4f7dfb` (dark mode) -- `app/globals.css`
- **Background**: `#f6f6f6` off-white (light), `#101113` (dark)
- **Fonts**: Barnule/Flexing for display & brand headings, Avona for body text (`tailwind.config.ts` `fontFamily`)
- Dark mode is fully supported with its own token set, not just an inverted light theme

## Design Principles (`docs/06-design-system.md`)
- **Simple over feature-rich** -- merchant dashboard should take ~2 minutes to learn
- **Visual, not numeric** -- progress bars, filled stamp grids, stage journeys over raw numbers wherever the customer sees something
- **Bilingual from day one** -- every string goes through `next-intl` with full `en`/`ar` RTL support, not bolted on later

## Wallet Pass Visuals
- Stamp cards: grid of circles/icons, filled vs. empty, merchant's chosen icon/emoji + brand color
- Point cards: progress bar / star-fill visual, plus raw "X / Y" as secondary text
- Steps/journey: path of stage nodes (locked / current / completed), each with icon + label

## Content Tone
- **Merchant-facing**: direct, benefit-oriented ("Get customers coming back -- not just another wallet card")
- **Customer-facing** (pass/enrollment page): warm, simple, low-friction ("Add your card, start earning rewards")
- Live homepage hero (per `messages/en.json`): "Turn casual guests into regulars."

## Component Library
- Consistent primitive layer in `components/ui`
- Merchant brand color picker live-updates the wallet pass preview (`components/wallet-preview`) in real time
- Accessible color contrast validation on merchant-chosen pass colors is a stated requirement -- confirm current implementation status with Dev before assuming it's live
