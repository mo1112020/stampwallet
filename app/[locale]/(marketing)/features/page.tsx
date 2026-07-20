import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";

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
    { href: `/${locale}/features/wallet`, title: t("walletTitle"), body: t("walletBody") },
    { href: `/${locale}/features/programs`, title: t("programsTitle"), body: t("programsBody") },
    { href: `/${locale}/features/updates`, title: t("updatesTitle"), body: t("updatesBody") },
    { href: `/${locale}/features/analytics`, title: t("analyticsTitle"), body: t("analyticsBody") },
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
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[24px] border border-[var(--line)] bg-white p-8 transition hover:border-[var(--line-strong)]"
            >
              <h2 className="text-2xl font-semibold">{card.title}</h2>
              <p className="mt-3 text-[var(--muted)]">{card.body}</p>
              <p className="mt-6 text-sm font-semibold text-[var(--primary)]">{common("learnMore")} →</p>
            </Link>
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
