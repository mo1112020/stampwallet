import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.about");
  const common = await getTranslations("site.common");

  const values = [
    { title: t("v1Title"), body: t("v1Body") },
    { title: t("v2Title"), body: t("v2Body") },
    { title: t("v3Title"), body: t("v3Body") },
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
        <Reveal as="div" className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-semibold text-[var(--ink)]">{t("missionTitle")}</h2>
          <p className="mt-4 text-lg text-[var(--muted)]">{t("missionBody")}</p>
        </Reveal>
      </section>
      <section className="border-y border-[var(--line)] bg-[var(--surface-2)] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold text-[var(--ink)]">{t("valuesTitle")}</h2>
          <StaggerGroup className="mt-10 grid gap-8 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-[24px] bg-[var(--surface)] p-7">
                <h3 className="text-xl font-semibold text-[var(--ink)]">{v.title}</h3>
                <p className="mt-3 text-[var(--muted)]">{v.body}</p>
              </div>
            ))}
          </StaggerGroup>
        </div>
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
