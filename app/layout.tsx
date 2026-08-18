import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "WalletOS",
  description: "Loyalty cards customers actually use — in Apple and Google Wallet.",
};

// Genuinely bilingual (Arabic + Latin, matched weights in one family) rather
// than a Latin display face with Arabic bolted on — the marketing site's
// "Stamp & Verdict" world (app/globals.css .ws-stamp) is built on it.
const cairo = Cairo({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`antialiased ${cairo.variable}`} suppressHydrationWarning>
        {/* prettier-ignore */}
        <div
          style={{ display: "contents" }}
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: the stamp card, not the SaaS dashboard, is the interface — marks and verdicts replace gradients and glass.
OWN-WORLD: warm kraft paper (#f3e9d8) and near-black ink, one rubber-stamp red (#b23a1a) accent, Cairo Black bilingual display type, hard 2px ink borders with offset drop-shadows instead of soft rounded cards.
STORY: a café/salon owner sees their own counter ritual — a stamp card, a tally, a verdict — rebuilt as software they would trust to run it.
FIRST VIEWPORT: hero headline in stamped Cairo Black beside the real wallet-pass demo, taped to the kraft ground with a hard offset shadow, not floating chrome.
FORM: Stamp & Verdict, fused from challenger pop-culture-shelf-teen-magazine-quiz, seed key 0ac39a20.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
-->`,
          }}
        />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
