import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CtaBand } from "@/components/marketing/cta-band";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.home");
  const common = await getTranslations("site.common");

  return (
    <main>
      <section className="relative min-h-[100dvh] overflow-hidden bg-[var(--surface)]">
        <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col items-center gap-10 px-6 pb-16 pt-28 md:gap-12 lg:flex-row lg:gap-14 lg:pb-20 lg:pt-28 rtl:lg:flex-row-reverse">
          <Reveal as="div" y={16} className="mx-auto h-[500px] w-[283px] shrink-0 lg:mx-0">
            <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[var(--surface-2)]">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              >
                <source src="/videos/loyalty-hero.webm" type="video/webm" />
              </video>
            </div>
          </Reveal>

          <Reveal as="div" delay={0.1} className="relative flex w-full flex-1 flex-col justify-center lg:max-w-xl">
            <p className="font-brand text-sm text-[var(--primary)] md:text-base">StampWallet</p>
            <h1 className="mt-5 max-w-[14ch] text-4xl font-bold tracking-tight text-[var(--ink)] md:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-md text-base text-[var(--muted)] md:text-lg">{t("heroSub")}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={`/${locale}/signup`} className={buttonVariants()}>
                {t("heroCta")}
              </Link>
              <Link href={`/${locale}/features`} className={buttonVariants({ variant: "outline" })}>
                {t("heroSecondary")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-24 md:py-32">
        <Reveal as="div" className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold tracking-tight text-[var(--ink)] md:text-5xl">{t("pocketTitle")}</h2>
          <p className="mt-5 max-w-xl text-[var(--muted)] text-pretty">{t("pocketSub")}</p>
          <Link
            href={`/${locale}/features/wallet`}
            className="mt-6 inline-flex text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            {common("learnMore")}
          </Link>
        </Reveal>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface-2)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="max-w-md text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
            {t("exploreTitle")}
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-3">
            <Link
              href={`/${locale}/features`}
              className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7 transition-colors hover:border-[var(--line-strong)]"
            >
              <h3 className="text-xl font-semibold text-[var(--ink)]">{t("exploreFeatures")}</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">{t("exploreFeaturesBody")}</p>
            </Link>
            <Link
              href={`/${locale}/industries`}
              className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7 transition-colors hover:border-[var(--line-strong)]"
            >
              <h3 className="text-xl font-semibold text-[var(--ink)]">{t("exploreIndustries")}</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">{t("exploreIndustriesBody")}</p>
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7 transition-colors hover:border-[var(--line-strong)]"
            >
              <h3 className="text-xl font-semibold text-[var(--ink)]">{t("explorePricing")}</h3>
              <p className="mt-3 text-sm text-[var(--muted)]">{t("explorePricingBody")}</p>
            </Link>
          </StaggerGroup>
        </div>
      </section>

      <CtaBand
        title={t("heroTitle")}
        description={t("heroSub")}
        href={`/${locale}/signup`}
        label={common("startFree")}
      />
    </main>
  );
}
