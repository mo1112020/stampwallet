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
  /**
   * Optional HowTo structured-data steps, for posts that are genuinely a
   * numbered procedure (not every post — a comparison/explainer post has
   * nothing real to put here). Mirrors the post's own numbered-list content
   * rather than being independently authored, so it can't drift from what
   * a reader actually sees.
   */
  howTo?: {
    name: string;
    steps: { name: string; text: string }[];
  };
};

/**
 * Registry of every published blog post — single source of truth for the
 * index listing, sitemap.ts, and hreflang pairing. New posts from
 * .company/departments/marketing/keyword-cluster-strategy.md get added here
 * as they're written, plus one loader line in registry.ts; the route
 * infrastructure itself (app/[locale]/(marketing)/blog/**) doesn't change
 * per post.
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
    counterpartSlug: "digital-loyalty-card-guide-mena",
  },
  {
    slug: "stamp-card-vs-points-vs-reward-journey",
    locale: "en",
    title: "Stamp Card vs Points Program vs Reward Journey: Which Loyalty Model Fits Your Business?",
    description:
      "The three loyalty models look similar but reward completely different behavior. Here's how to pick the one that actually fits your business.",
    date: "2026-08-26",
    cluster: "mechanics",
    counterpartSlug: "stamp-vs-points-loyalty-arabic",
  },
  {
    slug: "digital-loyalty-card-guide-mena",
    locale: "ar",
    title: "دليل بطاقة الولاء الرقمية لتجار السعودية والإمارات",
    description:
      "كيف تعمل بطاقة الولاء الرقمية مع Apple Wallet وGoogle Wallet، ولماذا تناسب تجار الخليج تحديدًا، من الانضمام حتى استبدال المكافأة.",
    date: "2026-08-26",
    cluster: "mena",
    counterpartSlug: "digital-loyalty-cards-guide",
  },
  {
    slug: "car-wash-loyalty-program",
    locale: "en",
    title: "Car Wash Loyalty Program: Digital Stamp Cards Customers Actually Use",
    description:
      "Car washes are one of the best-fitted businesses for a stamp card, and one of the worst-served by paper ones. Here's how to run it digitally.",
    date: "2026-08-26",
    cluster: "verticals",
    howTo: {
      name: "How to run a car wash loyalty program with a wallet pass",
      steps: [
        {
          name: "Enroll at the pay station or entrance kiosk",
          text: "A QR code at checkout, or a code printed on the receipt, gets scanned once and the pass is added in seconds. No app, no account creation, nothing that slows down a line of cars.",
        },
        {
          name: "Award a stamp per visit",
          text: "Either by staff scanning the pass at a manned bay, or automatically tied to the transaction at an unmanned pay terminal if the system integrates with it.",
        },
        {
          name: "The pass updates immediately",
          text: "The next time the customer opens their wallet, or the next time the pass surfaces near the location, the new stamp count is already there. No syncing required.",
        },
      ],
    },
  },
  {
    slug: "stamp-vs-points-loyalty-arabic",
    locale: "ar",
    title: "الفرق بين بطاقة الأختام الرقمية ونظام نقاط الولاء",
    description:
      "ما الذي يستحق المكافأة فعلاً؟ الزيارة أم الإنفاق أم الاستمرارية. دليل عملي لاختيار نظام الولاء المناسب لنشاطك.",
    date: "2026-08-26",
    cluster: "mechanics",
    counterpartSlug: "stamp-card-vs-points-vs-reward-journey",
  },
  {
    slug: "wallet-loyalty-cards-no-app-download",
    locale: "en",
    title: "No App Required: How Apple Wallet & Google Wallet Loyalty Cards Actually Work",
    description:
      "No account, no install, no password. Here's exactly how a wallet pass gets onto a customer's phone and keeps itself updated after that.",
    date: "2026-08-27",
    cluster: "mechanics",
  },
  {
    slug: "reward-journey-tiered-loyalty-explained",
    locale: "en",
    title: "What Is a Reward Journey? Tiered Loyalty Programs Explained (Bronze to VIP)",
    description:
      "Not every loyalty program should reward a single purchase. Here's how staged, tiered loyalty works and which businesses actually benefit from it.",
    date: "2026-08-27",
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
