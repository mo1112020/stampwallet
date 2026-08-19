import Link from "next/link";
import type { Metadata } from "next";
import { Mail, HelpCircle, Compass, MessageCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.support" });
  return buildPageMetadata({ locale, path: "support", title: t("title"), description: t("description") });
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.support");
  const common = await getTranslations("site.common");

  // Optional -- unset in an environment (e.g. a preview deploy) just hides
  // the card rather than rendering a broken/empty contact link.
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  const channels = [
    ...(whatsappNumber
      ? [
          {
            icon: MessageCircle,
            title: t("whatsappTitle"),
            body: t("whatsappBody"),
            href: `https://wa.me/${whatsappNumber}`,
            label: t("whatsappCta"),
          },
        ]
      : []),
    {
      icon: Mail,
      title: t("emailTitle"),
      body: t("emailBody"),
      href: `mailto:${t("email")}`,
      label: t("email"),
    },
    {
      icon: HelpCircle,
      title: t("faqTitle"),
      body: t("faqBody"),
      href: `/${locale}/faq`,
      label: t("faqCta"),
    },
    {
      icon: Compass,
      title: t("guideTitle"),
      body: t("guideBody"),
      href: `/${locale}/features`,
      label: t("guideCta"),
    },
  ];

  return (
    <main>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <section className="px-6 py-16">
        <StaggerGroup
          className={`mx-auto grid max-w-5xl gap-6 ${
            whatsappNumber ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"
          }`}
        >
          {channels.map((channel) => (
            <Reveal
              as="div"
              key={channel.title}
              className="flex flex-col rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7"
            >
              <channel.icon className="h-6 w-6 text-[var(--primary)]" strokeWidth={1.75} />
              <h2 className="mt-4 text-lg font-semibold text-[var(--ink)]">{channel.title}</h2>
              <p className="mt-2 flex-1 text-sm text-[var(--muted)]">{channel.body}</p>
              <Link
                href={channel.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:underline"
              >
                {channel.label}
                <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
              </Link>
            </Reveal>
          ))}
        </StaggerGroup>
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
