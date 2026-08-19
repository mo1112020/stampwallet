import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { FaqSection } from "@/components/marketing/faq";
import { CtaBand } from "@/components/marketing/cta-band";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { FAQ_KEYS } from "@/lib/faq-keys";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.faqPage" });
  return buildPageMetadata({ locale, path: "faq", title: t("title"), description: t("description") });
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.faqPage");
  const common = await getTranslations("site.common");
  const faqT = await getTranslations("landing.faq");

  // FAQPage structured data — same 12 questions FaqSection renders
  // (FAQ_KEYS is exported from there specifically so this can't drift from
  // what's actually on the page), just described for AI/search parsing
  // rather than for the interactive accordion.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_KEYS.map((key) => ({
      "@type": "Question",
      name: faqT(`items.${key}.q`),
      acceptedAnswer: {
        "@type": "Answer",
        text: faqT(`items.${key}.a`),
      },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <section className="px-6 py-16">
        <FaqSection />
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
