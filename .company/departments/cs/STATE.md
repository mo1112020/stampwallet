# Customer Success -- State

## What Exists Today
- Marketing site `support` and `faq` pages (`app/[locale]/(marketing)/`)
- No dedicated helpdesk/ticketing system found wired into the codebase (no Zendesk/Intercom/Freshdesk integration in `package.json`)
- Customer-facing surface is intentionally minimal by design (no login, no app -- see `.company/VISION.md`), so most "CS" for end customers is likely handled merchant-side, not by WalletOS directly
- Merchant-side support channel/process: not found in code

## Support Channel (confirmed by CEO, 2026-08)
**WhatsApp initially.** Email/chat planned for later as WalletOS scales past pre-launch. Low-cost by design, consistent with no external funding (`.company/STATE.md`).

**Live as of 2026-08-19**: the decision existed but was never actually wired into the site -- the `/support` page had no WhatsApp link. Fixed: added a WhatsApp card (matching the existing email/FAQ/features pattern), driven by `NEXT_PUBLIC_WHATSAPP_NUMBER` (+90 554 186 9905), graceful no-op if unset. Live and verified at walletos.online/en/support.

## Gaps
- No recurring support themes/escalations yet -- expected, given 0 merchants pre-launch
