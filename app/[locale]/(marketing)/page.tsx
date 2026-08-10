import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Bell, Layers, QrCode, ScanLine, Smartphone, Store, Tag, UserPlus, Wallet } from "lucide-react";
import { CtaBand } from "@/components/marketing/cta-band";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { IconCard } from "@/components/marketing/icon-card";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { WalletPreviewCard } from "@/components/marketing/wallet-preview-card";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

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
      <section className="relative min-h-[100dvh] overflow-hidden bg-[var(--surface)]">
        <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col items-center gap-10 px-6 pb-16 pt-28 md:gap-12 lg:flex-row lg:gap-14 lg:pb-20 lg:pt-28 rtl:lg:flex-row-reverse">
          <Reveal
            as="div"
            y={16}
            className="mx-auto aspect-[283/500] w-[85vw] max-w-[380px] shrink-0 lg:mx-0 lg:aspect-auto lg:h-[500px] lg:w-[283px] lg:max-w-none"
          >
            <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[var(--surface-2)]">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                // Gives the browser an immediately-paintable frame instead of
                // nothing until the video's own data streams in and decodes —
                // this is the hero's LCP candidate, so that gap is exactly
                // what shows up as a slow/non-discoverable LCP in Lighthouse.
                poster="/videos/loyalty-hero-poster.jpg"
              >
                <source src="/videos/loyalty-hero.webm" type="video/webm" />
              </video>
            </div>
          </Reveal>

          <Reveal as="div" delay={0.1} className="relative flex w-full flex-1 flex-col justify-center lg:max-w-xl">
            <Logo className="h-5 md:h-6" />
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
            <TrustBadges
              className="mt-10"
              appleLabel={t("trustApple")}
              googleLabel={t("trustGoogle")}
              capabilities={[
                { icon: Smartphone, label: t("trustNoApp") },
                { icon: Bell, label: t("trustUpdates") },
              ]}
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
            <WalletPreviewCard platform="apple" />
          </Reveal>
        </div>
      </section>

      <HowItWorks title={t("howTitle")} description={t("howSubtitle")} steps={howSteps} stepLabel={t("howStepLabel")} />

      <section className="border-y border-[var(--line)] bg-[var(--surface-2)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="max-w-md text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
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
