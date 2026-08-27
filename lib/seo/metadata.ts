import type { Metadata } from "next";
import { locales, defaultLocale } from "@/i18n/config";

export function appUrl() {
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
  localePaths,
  hasGeneratedImage,
}: {
  locale: string;
  /** Route path with no leading locale segment — "" for the homepage, "about", "features/wallet", etc. */
  path: string;
  title: string;
  description: string;
  /** Per-locale path override for pages whose path differs by locale — blog
   * posts, whose slug is authored per-language rather than translated 1:1
   * (see content/blog/manifest.ts). Falls back to `path` for any locale not
   * listed here, so pages with a shared path across all locales don't need
   * this at all. */
  localePaths?: Partial<Record<string, string>>;
  /** True for routes with their own opengraph-image.tsx (blog index/posts —
   * see lib/og/blog-card.tsx). Next merges file-convention images with
   * whatever's set here rather than one replacing the other, so this omits
   * the fallback logo image entirely to avoid a page shipping two og:image
   * tags — the generated one first, the generic logo trailing behind it. */
  hasGeneratedImage?: boolean;
}): Metadata {
  const base = appUrl();
  const urlFor = (l: string) => {
    const p = localePaths?.[l] ?? path;
    return `${base}/${l}${p ? `/${p}` : ""}`;
  };
  const canonical = urlFor(locale);
  const ogImage = `${base}${OG_IMAGE_PATH}`;

  // localePaths being passed at all (even as {}) means this route's path is
  // authored per-locale rather than shared verbatim across locales (blog
  // posts) — restrict alternates to locales we actually have a real path
  // for, instead of falsely reusing this locale's own path for a locale
  // with no equivalent page (which previously produced hreflang alternates
  // pointing at 404s for posts with no published counterpart yet).
  const alternateLocales = localePaths
    ? locales.filter((l) => l === locale || localePaths[l] !== undefined)
    : locales;
  const defaultAlternateLocale = alternateLocales.includes(defaultLocale) ? defaultLocale : locale;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(alternateLocales.map((l) => [l, urlFor(l)])),
        "x-default": urlFor(defaultAlternateLocale),
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "WalletOS",
      locale: locale === "ar" ? "ar_AR" : "en_US",
      type: "website",
      ...(hasGeneratedImage ? {} : { images: [{ url: ogImage, width: 900, height: 220, alt: "WalletOS" }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(hasGeneratedImage ? {} : { images: [ogImage] }),
    },
  };
}
