import Link from "next/link";
import { headers } from "next/headers";
import { buttonVariants } from "@/components/ui/button";
import { defaultLocale, isRtl, locales, type AppLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

const MESSAGES = { en, ar } as const;

/**
 * Next.js renders THIS file (not app/[locale]/not-found.tsx) for any URL
 * that doesn't match a defined route, even under /ar/... or /en/... —
 * nested not-found.tsx files only fire from an explicit notFound() call
 * inside an already-matched page. Since not-found.tsx never receives
 * `params`, the locale comes from the x-locale header proxy.ts sets on
 * every request (the URL's first path segment, defaulted to defaultLocale).
 */
export default async function RootNotFound() {
  const headerList = await headers();
  const rawLocale = headerList.get("x-locale");
  const locale = (locales as readonly string[]).includes(rawLocale ?? "")
    ? (rawLocale as AppLocale)
    : defaultLocale;
  const t = MESSAGES[locale].notFoundPage;

  // app/layout.tsx (the root layout) already renders <html>/<body> around
  // this — nesting them again here would be invalid HTML — so dir/lang go
  // on a wrapping div, matching app/[locale]/layout.tsx's own pattern.
  return (
    <div lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className="min-h-screen">
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] px-6 py-16 text-center">
        <Link href={`/${locale}`} className="font-brand text-sm text-[var(--ink)]">
          StampWallet
        </Link>

        <p className="mt-10 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          {t.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
          {t.title}
        </h1>
        <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">{t.description}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/${locale}`} className={buttonVariants({ variant: "outline" })}>
            {t.backHome}
          </Link>
          <Link href={`/${locale}/dashboard`} className={buttonVariants()}>
            {t.goToDashboard}
          </Link>
        </div>
      </main>
    </div>
  );
}
