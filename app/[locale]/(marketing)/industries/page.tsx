import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Coffee, Dumbbell, Scissors, Store, UtensilsCrossed } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { IconCard } from "@/components/marketing/icon-card";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.industries" });
  return buildPageMetadata({ locale, path: "industries", title: t("title"), description: t("description") });
}

export default async function IndustriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.industries");
  const common = await getTranslations("site.common");

  const items = [
    { icon: Coffee, title: t("cafes"), body: t("cafesBody") },
    { icon: Scissors, title: t("salons"), body: t("salonsBody") },
    { icon: Dumbbell, title: t("gyms"), body: t("gymsBody") },
    { icon: UtensilsCrossed, title: t("restaurants"), body: t("restaurantsBody") },
    { icon: Store, title: t("retail"), body: t("retailBody") },
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
        <StaggerGroup className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <IconCard key={item.title} icon={item.icon} title={item.title} body={item.body} />
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
