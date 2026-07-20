import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";

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
    { title: t("b1Title"), body: t("b1Body") },
    { title: t("b2Title"), body: t("b2Body") },
    { title: t("b3Title"), body: t("b3Body") },
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
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {blocks.map((b) => (
            <div key={b.title} className="bg-[var(--surface-2)] p-7">
              <h2 className="text-xl font-semibold">{b.title}</h2>
              <p className="mt-3 text-[var(--muted)]">{b.body}</p>
            </div>
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
