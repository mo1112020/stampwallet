import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BarChart3, Bell, Smartphone, Layers } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { IconCard } from "@/components/marketing/icon-card";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.features" });
  return buildPageMetadata({ locale, path: "features", title: t("title"), description: t("description") });
}

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.features");
  const common = await getTranslations("site.common");

  const cards = [
    { icon: Smartphone, href: `/${locale}/features/wallet`, title: t("walletTitle"), body: t("walletBody") },
    { icon: Layers, href: `/${locale}/features/programs`, title: t("programsTitle"), body: t("programsBody") },
    { icon: Bell, href: `/${locale}/features/updates`, title: t("updatesTitle"), body: t("updatesBody") },
    { icon: BarChart3, href: `/${locale}/features/analytics`, title: t("analyticsTitle"), body: t("analyticsBody") },
  ];

  return (
    <main>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        ctaHref={`/${locale}/signup`}
        ctaLabel={common("getStarted")}
      />
      <section className="px-6 py-20">
        <StaggerGroup className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <IconCard key={card.href} icon={card.icon} href={card.href} title={card.title} body={card.body} cta={common("learnMore")} />
          ))}
        </StaggerGroup>
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
