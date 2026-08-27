import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { CtaBand } from "@/components/marketing/cta-band";
import { buildPageMetadata, appUrl } from "@/lib/seo/metadata";
import { locales } from "@/i18n/config";
import { BLOG_POSTS, getPost, type BlogPost } from "@/content/blog/manifest";
import { loadPostBody } from "@/content/blog/registry";

// No generateStaticParams here, deliberately — the root layout
// (app/layout.tsx) reads headers() to resolve lang/dir on <html>, which
// forces the whole render tree dynamic (Next's DYNAMIC_SERVER_USAGE rule:
// a route can't statically prerender while an ancestor layout depends on
// per-request headers). Every other page in this app is already dynamic
// for the same reason; this route matches that instead of fighting it.

/** This post's slug in the other locale, if a genuine (not machine-translated)
 * counterpart has been published — see BlogPost.counterpartSlug. Always
 * returns an object (possibly empty), never undefined: blog slugs are
 * per-locale content regardless of whether a counterpart exists yet, so
 * buildPageMetadata must restrict hreflang alternates to locales listed
 * here rather than falling back to this post's own slug for a locale with
 * no equivalent page. */
function counterpartPath(post: BlogPost): Partial<Record<string, string>> {
  if (!post.counterpartSlug) return {};
  const otherLocale = locales.find((l) => l !== post.locale);
  if (!otherLocale) return {};
  const counterpart = BLOG_POSTS.find((p) => p.locale === otherLocale && p.slug === post.counterpartSlug);
  if (!counterpart) return {};
  return { [otherLocale]: `blog/${counterpart.slug}` };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(locale, slug);
  if (!post) return {};
  return buildPageMetadata({
    locale,
    path: `blog/${slug}`,
    title: post.title,
    description: post.description,
    localePaths: counterpartPath(post),
    hasGeneratedImage: true,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPost(locale, slug);
  if (!post) notFound();

  setRequestLocale(locale);
  const t = await getTranslations("site.blog");
  const common = await getTranslations("site.common");

  // content/blog/registry.ts holds one literal import() per post, keyed by
  // this same (locale, slug) pair — see that file for why it's not a single
  // template-literal dynamic import.
  const postBodyModule = await loadPostBody(locale, slug);
  if (!postBodyModule) notFound();
  const PostBody = postBodyModule.default;

  const dateLabel = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(post.date));

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    // No dateModified: posts are static MDX with no edit-tracking, so a
    // fabricated value equal to datePublished would just look right by
    // accident today and silently mislead the day a post is actually edited.
    datePublished: post.date,
    image: `${appUrl()}/${locale}/blog/${slug}/opengraph-image`,
    author: { "@type": "Organization", name: "WalletOS" },
    publisher: { "@type": "Organization", name: "WalletOS" },
    mainEntityOfPage: `${appUrl()}/${locale}/blog/${slug}`,
  };

  const howToJsonLd = post.howTo
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: post.howTo.name,
        step: post.howTo.steps.map((step) => ({
          "@type": "HowToStep",
          name: step.name,
          text: step.text,
        })),
      }
    : null;

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {howToJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      )}
      <section className="bg-[var(--surface)] px-6 pb-12 pt-32 md:pb-16 md:pt-36">
        <Reveal as="div" className="mx-auto max-w-3xl">
          <Link
            href={`/${locale}/blog`}
            className="text-[13px] font-semibold text-[var(--primary)] hover:underline"
          >
            ← {t("backToBlog")}
          </Link>
          <p className="mt-4 text-[13px] font-medium text-[var(--muted)]">{dateLabel}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">{post.title}</h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--muted)] md:text-lg">{post.description}</p>
        </Reveal>
      </section>
      <article className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <PostBody />
        </div>
      </article>
      <CtaBand
        title={t("title")}
        description={t("description")}
        href={`/${locale}/signup`}
        label={common("startFree")}
      />
    </main>
  );
}
