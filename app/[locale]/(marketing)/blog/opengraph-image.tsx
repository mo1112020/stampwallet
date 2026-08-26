import { renderBlogCard, OG_SIZE } from "@/lib/og/blog-card";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

const MESSAGES = { en, ar } as const;

export const alt = "WalletOS Blog";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (locales as readonly string[]).includes(rawLocale) ? (rawLocale as AppLocale) : defaultLocale;
  const t = MESSAGES[locale].site.blog;

  return renderBlogCard({ eyebrow: t.eyebrow, title: t.title, locale });
}
