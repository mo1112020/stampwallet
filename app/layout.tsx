import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { defaultLocale, isRtl, locales, type AppLocale } from "@/i18n/config";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://walletos.online";
}

/** Sitewide Organization + WebSite structured data — previously zero JSON-LD
 * existed anywhere on the site. Locale-agnostic (name/url/logo don't change
 * per language), so it lives here rather than per-page. Rendered as a plain
 * <script> tag per Next.js's own recommended pattern for JSON-LD in the App
 * Router (the Metadata API itself has no structured-data field). */
function organizationJsonLd() {
  const base = appUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "WalletOS",
        url: base,
        logo: `${base}/brand/logo-horizontal-light.png`,
        description: "Loyalty cards customers actually use — in Apple and Google Wallet.",
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        name: "WalletOS",
        url: base,
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  };
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://walletos.online"),
  title: {
    default: "WalletOS",
    // Every marketing page sets its own full title via generateMetadata
    // (lib/seo/metadata.ts) — this template only applies when a page
    // doesn't override it.
    template: "%s | WalletOS",
  },
  description: "Loyalty cards customers actually use — in Apple and Google Wallet.",
};

// interactiveWidget: "resizes-content" — without this, opening the on-screen
// keyboard only shrinks the *visual* viewport (default "resizes-visual");
// the layout viewport that `dvh` units are computed from stays the same
// height. That mismatch is what was dragging the dashboard's fixed 100dvh
// shell (topbar + bottom nav, see app/[locale]/dashboard/layout.tsx) out of
// place on scroll or keyboard focus: the document became taller than what
// was actually visible and the browser started scrolling it as a whole to
// keep the focused input in view. Resizing the layout viewport itself keeps
// dvh in sync with the real visible area, so no document-level scroll is
// ever triggered.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is shared across every locale (it's the parent of
  // app/[locale]), so it can't read a `locale` route param directly — it
  // reads the x-locale header proxy.ts sets on every request instead, same
  // approach app/not-found.tsx already uses. Nested layouts already set
  // lang/dir on a wrapping div (app/[locale]/layout.tsx); this additionally
  // sets it on the actual <html> element, since that's what Lighthouse's
  // accessibility audit (and screen readers before hydration) checks.
  const headerList = await headers();
  const rawLocale = headerList.get("x-locale");
  const locale = (locales as readonly string[]).includes(rawLocale ?? "")
    ? (rawLocale as AppLocale)
    : defaultLocale;

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} suppressHydrationWarning>
      <body className={`antialiased ${cairo.variable}`} suppressHydrationWarning>
        {/* Google Consent Mode v2 default -- must run before GoogleAnalytics
            below initializes, so GA never writes analytics cookies until a
            visitor actually accepts (components/consent/cookie-consent.tsx
            flips this to "granted" on Accept, and re-applies it on every
            page load once a prior "granted" choice is in localStorage).
            beforeInteractive is required (and only valid) in the root
            layout -- it's what guarantees this runs ahead of GA's own
            afterInteractive script regardless of DOM order. */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'analytics_storage':'denied','ad_storage':'denied'});`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
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
        {/* Optional -- unset in any environment (local dev, previews) just
            skips loading GA entirely rather than sending a broken/empty
            measurement ID. See .env.example. */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
