import { headers } from "next/headers";
import type { Metadata } from "next";
import { defaultLocale, isRtl, locales, type AppLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { NotFoundView } from "@/components/marketing/not-found-view";

const MESSAGES = { en, ar } as const;

async function resolveLocale(): Promise<AppLocale> {
  const headerList = await headers();
  const rawLocale = headerList.get("x-locale");
  return (locales as readonly string[]).includes(rawLocale ?? "") ? (rawLocale as AppLocale) : defaultLocale;
}

// Otherwise every unmatched URL renders with the root layout's generic
// "WalletOS" <title> (its template default), making 404s indistinguishable
// from real pages in browser tabs and crawl/log reports.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return { title: MESSAGES[locale].notFoundPage.title };
}

/**
 * Next.js renders THIS file (not app/[locale]/not-found.tsx) for any URL
 * that doesn't match a defined route, even under /ar/... or /en/... —
 * nested not-found.tsx files only fire from an explicit notFound() call
 * inside an already-matched page. Since not-found.tsx never receives
 * `params`, the locale comes from the x-locale header proxy.ts sets on
 * every request (the URL's first path segment, defaulted to defaultLocale).
 */
export default async function RootNotFound() {
  const locale = await resolveLocale();
  const t = MESSAGES[locale].notFoundPage;

  // app/layout.tsx (the root layout) already renders <html>/<body> around
  // this — nesting them again here would be invalid HTML — so dir/lang go
  // on a wrapping div, matching app/[locale]/layout.tsx's own pattern.
  return (
    <div lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className="min-h-screen">
      <NotFoundView
        locale={locale}
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        backHome={t.backHome}
        goToDashboard={t.goToDashboard}
      />
    </div>
  );
}
