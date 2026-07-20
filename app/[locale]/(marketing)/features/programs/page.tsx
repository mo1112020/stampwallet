import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";

export default async function FeaturesProgramsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.featuresPrograms");
  const common = await getTranslations("site.common");

  const programs = [
    { title: t("stampTitle"), body: t("stampBody") },
    { title: t("pointsTitle"), body: t("pointsBody") },
    { title: t("stepsTitle"), body: t("stepsBody") },
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
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {programs.map((p) => (
            <article key={p.title} className="bg-[var(--surface-2)] p-8">
              <h2 className="text-2xl font-semibold">{p.title}</h2>
              <p className="mt-3 text-[var(--muted)]">{p.body}</p>
            </article>
          ))}
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
