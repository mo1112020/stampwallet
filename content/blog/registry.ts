import type { ComponentType } from "react";

/**
 * Explicit map of literal dynamic imports, one per published post. Each
 * entry's import() specifier is a fixed string literal — deliberately NOT a
 * template-literal path built from `${locale}/${slug}` at runtime, which
 * webpack/Turbopack "context module" resolution can be finicky about for a
 * two-variable-segment path (locale AND slug both runtime-computed). A
 * literal import() per post is unambiguously supported by both bundlers, at
 * the cost of one extra line here per new post alongside its manifest.ts entry.
 */
const POST_LOADERS: Record<string, () => Promise<{ default: ComponentType }>> = {
  "en:digital-loyalty-cards-guide": () => import("./en/digital-loyalty-cards-guide.mdx"),
  "en:stamp-card-vs-points-vs-reward-journey": () => import("./en/stamp-card-vs-points-vs-reward-journey.mdx"),
  "ar:digital-loyalty-card-guide-mena": () => import("./ar/digital-loyalty-card-guide-mena.mdx"),
  "en:car-wash-loyalty-program": () => import("./en/car-wash-loyalty-program.mdx"),
  "ar:stamp-vs-points-loyalty-arabic": () => import("./ar/stamp-vs-points-loyalty-arabic.mdx"),
  "en:wallet-loyalty-cards-no-app-download": () => import("./en/wallet-loyalty-cards-no-app-download.mdx"),
  "en:reward-journey-tiered-loyalty-explained": () => import("./en/reward-journey-tiered-loyalty-explained.mdx"),
  "en:pet-grooming-loyalty-card": () => import("./en/pet-grooming-loyalty-card.mdx"),
  "en:clinic-pharmacy-loyalty-program": () => import("./en/clinic-pharmacy-loyalty-program.mdx"),
  "en:independent-hotel-loyalty-program": () => import("./en/independent-hotel-loyalty-program.mdx"),
  "en:wallet-push-notifications-gcc-merchants": () => import("./en/wallet-push-notifications-gcc-merchants.mdx"),
  "en:whatsapp-business-wallet-loyalty-gcc": () => import("./en/whatsapp-business-wallet-loyalty-gcc.mdx"),
  "ar:whatsapp-wallet-loyalty-arabic": () => import("./ar/whatsapp-wallet-loyalty-arabic.mdx"),
  "en:ramadan-eid-loyalty-wallet-campaigns": () => import("./en/ramadan-eid-loyalty-wallet-campaigns.mdx"),
  "ar:ramadan-eid-loyalty-arabic": () => import("./ar/ramadan-eid-loyalty-arabic.mdx"),
  "ar:car-wash-loyalty-arabic": () => import("./ar/car-wash-loyalty-arabic.mdx"),
  "ar:independent-hotel-loyalty-arabic": () => import("./ar/independent-hotel-loyalty-arabic.mdx"),
};

export function loadPostBody(locale: string, slug: string) {
  return POST_LOADERS[`${locale}:${slug}`]?.();
}
