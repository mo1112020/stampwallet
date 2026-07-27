export type WalletPlatform = "ios" | "android" | "other";

/**
 * Server-side UA sniffing (no client JS / hydration flash) so the pass page
 * can render the right wallet button as the primary CTA on first paint.
 */
export function detectWalletPlatform(userAgent: string): WalletPlatform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}
