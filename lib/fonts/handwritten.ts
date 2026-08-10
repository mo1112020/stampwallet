import { Caveat } from "next/font/google";

/**
 * Self-hosted (via next/font, no runtime request to Google) — powers the
 * `font-handwritten` Tailwind utility (see tailwind.config.ts) used by the
 * creative pricing section's sketchy/marker-doodle look.
 */
export const handwrittenFont = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-handwritten",
  display: "swap",
});
