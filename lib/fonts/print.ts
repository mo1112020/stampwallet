import { Cairo } from "next/font/google";

/**
 * Self-hosted (via next/font, no runtime request to Google) — used only by the
 * printable marketing templates, which need real Arabic shaping the system font
 * stack doesn't guarantee. Cairo covers Arabic + Latin so both language variants
 * of a template share one typeface.
 */
export const printFont = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-print",
  display: "swap",
});
