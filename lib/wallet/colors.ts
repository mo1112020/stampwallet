import type { CardAppearance, LoyaltyProgram, Merchant } from "@/types";

/** The WalletOS live preview (program-form.tsx) always shows the program's
 * own config.primary_color/secondary_color when set, only falling back to
 * the merchant's default brand colors — but the wallet passes (Apple and
 * Google) were built reading merchant colors exclusively, so a program with
 * its own custom colors would silently render with the wrong (merchant
 * default) colors on the actual issued pass. This resolves colors the same
 * way the preview does, for both wallet platforms. */
function resolveColor(candidates: (string | undefined | null)[], fallback: string): string {
  for (const c of candidates) {
    if (c && /^#[0-9a-f]{6}$/i.test(c)) return c;
  }
  return fallback;
}

export function resolveBrandColors(program: LoyaltyProgram, merchant: Merchant) {
  const appearance = program.config as CardAppearance;
  return {
    primaryColor: resolveColor([appearance.primary_color, merchant.brand_color_primary], "#3E0856"),
    secondaryColor: resolveColor([appearance.secondary_color, merchant.brand_color_secondary], "#FAAE62"),
  };
}
