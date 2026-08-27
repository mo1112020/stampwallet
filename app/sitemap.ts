import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { BLOG_POSTS } from "@/content/blog/manifest";

// Public marketing routes only — dashboard/auth/pass routes are per-account
// or per-customer and excluded via robots.ts instead.
const ROUTES = [
  "",
  "about",
  "faq",
  "features",
  "features/analytics",
  "features/programs",
  "features/updates",
  "features/wallet",
  "industries",
  "infrastructure",
  "pricing",
  "support",
  "privacy",
  "terms",
  "blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://walletos.online";

  // No lastModified here — these routes have no real content-change
  // tracking, and stamping every static route with "now" on every request
  // makes the signal meaningless (everything looks perpetually just-changed,
  // which crawlers increasingly discount). Blog posts below use their real
  // publish date instead.
  const staticEntries = ROUTES.flatMap((route) =>
    locales.map((locale) => ({
      url: `${appUrl}/${locale}${route ? `/${route}` : ""}`,
    }))
  );

  // Unlike the static routes above (identical path across every locale),
  // blog post slugs are per-locale (see content/blog/manifest.ts) — each
  // post contributes exactly one entry, not one per locale.
  const postEntries = BLOG_POSTS.map((post) => ({
    url: `${appUrl}/${post.locale}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...staticEntries, ...postEntries];
}
