import type { Metadata } from "next";
import { locales, defaultLocale } from "@/i18n/config";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://walletos.online";
}

/** No dedicated 1200x630 social card exists yet — the horizontal logo is a
 * reasonable stand-in (same "renders on a light external surface" reasoning
 * components/emails/layout.tsx already uses it for). Swap for a designed OG
 * card image later; this just closes the "zero preview image" gap for now. */
const OG_IMAGE_PATH = "/brand/logo-horizontal-light.png";

/**
 * Shared per-page metadata builder for the marketing site. Every marketing
 * page previously inherited the one identical root-level title/description
 * (app/layout.tsx) with no OpenGraph/Twitter tags and no hreflang alternates
 * connecting the en/ar versions of the same page — this is what actually
 * differentiates them for search engines, social previews, and AI citation.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  /** Route path with no leading locale segment — "" for the homepage, "about", "features/wallet", etc. */
  path: string;
  title: string;
  description: string;
}): Metadata {
  const base = appUrl();
  const urlFor = (l: string) => `${base}/${l}${path ? `/${path}` : ""}`;
  const canonical = urlFor(locale);
  const ogImage = `${base}${OG_IMAGE_PATH}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, urlFor(l)])),
        "x-default": urlFor(defaultLocale),
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "WalletOS",
      locale: locale === "ar" ? "ar_AR" : "en_US",
      type: "website",
      images: [{ url: ogImage, width: 900, height: 220, alt: "WalletOS" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
