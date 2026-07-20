import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";

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
    { title: t("cafes"), body: t("cafesBody") },
    { title: t("salons"), body: t("salonsBody") },
    { title: t("gyms"), body: t("gymsBody") },
    { title: t("restaurants"), body: t("restaurantsBody") },
    { title: t("retail"), body: t("retailBody") },
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
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="border border-[var(--line)] p-7">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-[var(--muted)]">{item.body}</p>
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
