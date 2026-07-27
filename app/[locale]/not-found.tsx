import Link from "next/link";
import { headers } from "next/headers";
import { buttonVariants } from "@/components/ui/button";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { Logo } from "@/components/brand/logo";

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] px-6 py-16 text-center">
      <Link href={`/${locale}`}>
        <Logo className="h-5" />
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
  );
}
