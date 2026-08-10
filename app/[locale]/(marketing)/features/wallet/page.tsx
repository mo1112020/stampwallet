import { getTranslations, setRequestLocale } from "next-intl/server";
import { CreditCard, Layers, Wallet as WalletIcon } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { IconCard } from "@/components/marketing/icon-card";
import { Reveal } from "@/components/motion/reveal";
import { WalletPreviewCard } from "@/components/marketing/wallet-preview-card";

export default async function FeaturesWalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.featuresWallet");
  const common = await getTranslations("site.common");

  const blocks = [
    { icon: CreditCard, title: t("b1Title"), body: t("b1Body") },
    { icon: WalletIcon, title: t("b2Title"), body: t("b2Body") },
    { icon: Layers, title: t("b3Title"), body: t("b3Body") },
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

      <section className="px-6 pb-20">
        <Reveal as="div" className="mx-auto flex max-w-4xl flex-wrap items-start justify-center gap-10">
          <WalletPreviewCard platform="apple" stampsCollected={5} />
          <WalletPreviewCard platform="google" primaryColor="#1a73e8" stampsCollected={7} />
        </Reveal>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {blocks.map((b) => (
            <IconCard key={b.title} icon={b.icon} title={b.title} body={b.body} />
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
