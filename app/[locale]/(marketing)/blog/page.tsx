import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { IconCard } from "@/components/marketing/icon-card";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPostsForLocale } from "@/content/blog/manifest";
import { BookOpen } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.blog" });
  return buildPageMetadata({ locale, path: "blog", title: t("title"), description: t("description"), hasGeneratedImage: true });
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.blog");
  const common = await getTranslations("site.common");
  const posts = getPostsForLocale(locale);

  return (
    <main>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <section className="px-6 py-16">
        {posts.length === 0 ? (
          <p className="mx-auto max-w-3xl text-center text-[var(--muted)]">{t("empty")}</p>
        ) : (
          <StaggerGroup className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <IconCard
                key={post.slug}
                icon={BookOpen}
                title={post.title}
                body={post.description}
                href={`/${locale}/blog/${post.slug}`}
                cta={t("readMore")}
              />
            ))}
          </StaggerGroup>
        )}
      </section>
      <CtaBand
        title={t("title")}
        description={t("description")}
        href={`/${locale}/signup`}
        label={common("startFree")}
      />
    </main>
  );
}
