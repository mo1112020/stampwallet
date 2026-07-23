import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { StaggerGroup } from "@/components/motion/stagger-group";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.pricing");

  const plans = [
    {
      name: t("freeName"),
      price: t("freePrice"),
      desc: t("freeDesc"),
      cta: t("freeCta"),
      href: `/${locale}/signup`,
      featured: true,
    },
    {
      name: t("starterName"),
      price: t("starterPrice"),
      desc: t("starterDesc"),
      cta: t("starterCta"),
      href: `/${locale}/signup`,
      featured: false,
    },
    {
      name: t("proName"),
      price: t("proPrice"),
      desc: t("proDesc"),
      cta: t("proCta"),
      href: `/${locale}/signup`,
      featured: false,
    },
  ];

  return (
    <main>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <section className="px-6 py-20">
        <StaggerGroup className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={
                plan.featured
                  ? "rounded-[24px] border-2 border-[var(--primary)] bg-[var(--surface)] p-8"
                  : "rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-8"
              }
            >
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)]">
                {plan.price}
              </p>
              <p className="mt-3 text-[var(--muted)]">{plan.desc}</p>
              <Link
                href={plan.href}
                className="mt-8 inline-flex rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </StaggerGroup>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-[var(--muted)]">
          {t("note")}
        </p>
      </section>
    </main>
  );
}
