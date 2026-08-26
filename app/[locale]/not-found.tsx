import { headers } from "next/headers";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { NotFoundView } from "@/components/marketing/not-found-view";

const MESSAGES = { en, ar } as const;

/**
 * Fires for notFound() called explicitly from within an already-matched
 * page under [locale]/** (missing program, missing store location, etc).
 * Genuinely unmatched URLs never reach this file — see app/not-found.tsx.
 * Reads locale from the x-locale header (set in proxy.ts) rather than
 * next-intl's request-locale context, since not-found.tsx doesn't receive
 * `params` and that context isn't guaranteed to be populated here.
 */
export default async function LocaleNotFound() {
  const headerList = await headers();
  const rawLocale = headerList.get("x-locale");
  const locale = (locales as readonly string[]).includes(rawLocale ?? "")
    ? (rawLocale as AppLocale)
    : defaultLocale;
  const t = MESSAGES[locale].notFoundPage;

  return (
    <NotFoundView
      locale={locale}
      eyebrow={t.eyebrow}
      title={t.title}
      description={t.description}
      backHome={t.backHome}
      goToDashboard={t.goToDashboard}
    />
  );
}
