import { locales } from "@/i18n/config";
import { getPost } from "@/content/blog/manifest";

/** Swap the locale segment of a pathname, e.g. /en/dashboard/billing -> /ar/dashboard/billing. */
export function switchLocaleHref(pathname: string, nextLocale: string, currentLocale: string) {
  const segments = pathname.split("/");
  if (segments[1] !== currentLocale) return `/${nextLocale}`;

  // Blog post slugs are authored per-locale (content/blog/manifest.ts), not
  // shared across languages like every other route on this site — swapping
  // just the locale segment sends e.g. "stamp-card-vs-points-vs-reward-journey"
  // straight into /ar/blog/ where no such slug exists, landing on a 404.
  // Route through the post's actual counterpart instead, or the blog index
  // in the target locale if it doesn't have one yet.
  if (segments[2] === "blog" && segments[3]) {
    const post = getPost(currentLocale, segments[3]);
    const counterpart = post?.counterpartSlug ? getPost(nextLocale, post.counterpartSlug) : undefined;
    return counterpart ? `/${nextLocale}/blog/${counterpart.slug}` : `/${nextLocale}/blog`;
  }

  segments[1] = nextLocale;
  return segments.join("/") || `/${nextLocale}`;
}

/** Endonym for a locale code (e.g. "ar" -> "العربية"), so new locales never need a hardcoded label. */
export function localeLabel(code: string) {
  try {
    const name = new Intl.DisplayNames([code], { type: "language" }).of(code);
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export { locales };
