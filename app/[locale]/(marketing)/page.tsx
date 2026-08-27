import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Bell, Layers, QrCode, ScanLine, Smartphone, Store, Tag, UserPlus, Wallet } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { IconCard } from "@/components/marketing/icon-card";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { AnimatedWalletDemo } from "@/components/marketing/animated-wallet-demo";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buttonVariants } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return buildPageMetadata({ locale, path: "", title: t("title"), description: t("tagline") });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.home");
  const common = await getTranslations("site.common");

  const howSteps = [
    { icon: QrCode, title: t("howStep1Title"), description: t("howStep1Body") },
    { icon: UserPlus, title: t("howStep2Title"), description: t("howStep2Body") },
    { icon: Wallet, title: t("howStep3Title"), description: t("howStep3Body") },
    { icon: ScanLine, title: t("howStep4Title"), description: t("howStep4Body") },
    { icon: Bell, title: t("howStep5Title"), description: t("howStep5Body") },
  ];

  return (
    <main>
      <section className="relative min-h-[100dvh] overflow-hidden bg-[var(--white)]">
        <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col items-center gap-12 px-6 pb-16 pt-24 md:gap-14 lg:flex-row lg:gap-16 lg:pb-20 lg:pt-28 rtl:lg:flex-row-reverse">
          <Reveal
            as="div"
            y={16}
            className="mx-auto aspect-[283/500] w-[78vw] max-w-[340px] shrink-0 lg:mx-0 lg:aspect-auto lg:h-[460px] lg:w-[260px] lg:max-w-none"
          >
            <div className="relative h-full w-full overflow-hidden border-2 border-[var(--ink)] bg-[var(--white)]">
              {/* React 19 hoists <link> tags rendered anywhere in the tree
                  into <head> — this tells the browser to fetch the poster
                  (the hero's actual LCP paint target) at high priority
                  instead of at the default priority a <video> poster gets,
                  which is what was showing up as a slow/non-discoverable
                  LCP in Lighthouse. `fetchPriority` isn't a typed prop on
                  <video> itself, only on <img>/<link>/<script>. */}
              <link rel="preload" as="image" href="/videos/loyalty-hero-poster.jpg" fetchPriority="high" />
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                poster="/videos/loyalty-hero-poster.jpg"
              >
                <source src="/videos/loyalty-hero.webm" type="video/webm" />
              </video>
            </div>
          </Reveal>

          <Reveal as="div" delay={0.1} className="relative flex w-full flex-1 flex-col justify-center lg:max-w-xl">
            <span className="ws-stamp-in inline-flex w-fit items-center border-2 border-[var(--primary)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--primary)]">
              {t("trustNoApp")}
            </span>
            <h1 className="mt-5 max-w-[14ch] text-4xl font-[900] tracking-tight text-[var(--ink)] md:text-5xl lg:text-6xl">
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
            <TrustBadges
              className="mt-10"
              appleLabel={t("trustApple")}
              googleLabel={t("trustGoogle")}
              capabilities={[{ icon: Bell, label: t("trustUpdates") }]}
            />
          </Reveal>
        </div>
      </section>

      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <Reveal as="div" className="flex-1">
            <h2 className="text-4xl font-bold tracking-tight text-[var(--ink)] md:text-5xl">{t("pocketTitle")}</h2>
            <p className="mt-5 max-w-xl text-[var(--muted)] text-pretty">{t("pocketSub")}</p>
            <Link
              href={`/${locale}/features/wallet`}
              className="mt-6 inline-flex text-sm font-semibold text-[var(--primary)] hover:underline"
              aria-label={`${common("learnMore")} — ${t("pocketTitle")}`}
            >
              {common("learnMore")}
            </Link>
          </Reveal>
          <Reveal as="div" delay={0.1} className="shrink-0">
            <AnimatedWalletDemo platform="apple" />
          </Reveal>
        </div>
      </section>

      <HowItWorks title={t("howTitle")} description={t("howSubtitle")} steps={howSteps} stepLabel={t("howStepLabel")} />

      <section className="border-y-2 border-[var(--line-strong)] bg-[var(--surface-2)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="max-w-md text-3xl tracking-tight text-[var(--ink)] md:text-4xl">
            {t("exploreTitle")}
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-3">
            <IconCard
              icon={Layers}
              href={`/${locale}/features`}
              title={t("exploreFeatures")}
              body={t("exploreFeaturesBody")}
            />
            <IconCard
              icon={Store}
              href={`/${locale}/industries`}
              title={t("exploreIndustries")}
              body={t("exploreIndustriesBody")}
            />
            <IconCard
              icon={Tag}
              href={`/${locale}/pricing`}
              title={t("explorePricing")}
              body={t("explorePricingBody")}
            />
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
