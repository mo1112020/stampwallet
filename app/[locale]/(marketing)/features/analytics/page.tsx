import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.featuresAnalytics" });
  return buildPageMetadata({ locale, path: "features/analytics", title: t("title"), description: t("description") });
}

export default async function FeaturesAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.featuresAnalytics");
  const common = await getTranslations("site.common");

  const stats = [
    { label: t("stat1"), value: "1,248" },
    { label: t("stat2"), value: "316" },
    { label: t("stat3"), value: "84%" },
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
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="border border-[var(--line)] bg-[var(--surface-2)] p-6">
                <p className="text-sm text-[var(--muted)]">{s.label}</p>
                <p className="mt-2 font-display text-3xl font-semibold">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 max-w-2xl">
            <h2 className="text-2xl font-semibold">{t("exportTitle")}</h2>
            <p className="mt-3 text-[var(--muted)]">{t("exportBody")}</p>
          </div>
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
