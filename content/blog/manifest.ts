import { locales, type AppLocale } from "@/i18n/config";

export type BlogCluster = "mechanics" | "verticals" | "mena";

export type BlogPost = {
  slug: string;
  locale: AppLocale;
  title: string;
  description: string;
  /** ISO date (publish date), used for display and sitemap lastModified. */
  date: string;
  cluster: BlogCluster;
  /**
   * Slug of this post's genuine (not machine-translated) counterpart in the
   * other locale, if one exists yet — see keyword-cluster-strategy.md's
   * "English-only-viable vs needs-genuine-Arabic-treatment" table. Used to
   * build correct hreflang alternates; omitted entirely means this post has
   * no live counterpart yet, so alternates just point back to itself.
   */
  counterpartSlug?: string;
};

/**
 * Registry of every published blog post — single source of truth for the
 * index listing, generateStaticParams, sitemap.ts, and hreflang pairing.
 * New posts from .company/departments/marketing/keyword-cluster-strategy.md
 * get added here as they're written; the route infrastructure itself
 * (app/[locale]/(marketing)/blog/**) doesn't change per post.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "digital-loyalty-cards-guide",
    locale: "en",
    title: "How Digital Loyalty Cards Work: The Merchant's Guide to Apple Wallet & Google Wallet",
    description:
      "No app to download, no plastic to print. Here's exactly how a wallet-pass loyalty program works, from the customer's first tap to the reward they redeem.",
    date: "2026-08-26",
    cluster: "mechanics",
  },
];

export function getPost(locale: string, slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.locale === locale && p.slug === slug);
}

export function getPostsForLocale(locale: string): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.locale === locale).sort((a, b) => b.date.localeCompare(a.date));
}

/** Every (locale, slug) pair with a live post — for generateStaticParams and sitemap.ts. */
export function getAllPostParams(): { locale: AppLocale; slug: string }[] {
  return BLOG_POSTS.filter((p) => locales.includes(p.locale)).map((p) => ({ locale: p.locale, slug: p.slug }));
}
