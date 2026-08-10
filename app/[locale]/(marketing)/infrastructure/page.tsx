import { getTranslations, setRequestLocale } from "next-intl/server";
import { CreditCard, ScanLine, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { IconCard } from "@/components/marketing/icon-card";
import { StaggerGroup } from "@/components/motion/stagger-group";

export default async function InfrastructurePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.infrastructure");
  const common = await getTranslations("site.common");

  const blocks = [
    { icon: ShieldCheck, title: t("b1Title"), body: t("b1Body") },
    { icon: CreditCard, title: t("b2Title"), body: t("b2Body") },
    { icon: ScanLine, title: t("b3Title"), body: t("b3Body") },
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
        <StaggerGroup className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {blocks.map((b) => (
            <IconCard key={b.title} icon={b.icon} title={b.title} body={b.body} />
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
