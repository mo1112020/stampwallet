/** Shared between components/marketing/faq.tsx (client, renders the
 * accordion) and app/[locale]/(marketing)/faq/page.tsx (server, builds
 * FAQPage JSON-LD from the same list) — kept in its own plain module
 * because a "use client" file's exports become opaque client references
 * when imported from server code, so a plain data array can't be
 * re-exported from faq.tsx itself for server-side reuse. */
export const FAQ_KEYS = [
  "app",
  "iphone",
  "android",
  "walletApp",
  "scanning",
  "customize",
  "reward",
  "paper",
  "cost",
  "pos",
  "industries",
  "launch",
] as const;
