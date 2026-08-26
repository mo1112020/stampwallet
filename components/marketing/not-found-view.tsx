import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LogoStamp } from "@/components/brand/logo-stamp";

/**
 * Shared "Stamp & Verdict" presentation for both 404 cases this app has —
 * app/not-found.tsx (genuinely unmatched URL) and app/[locale]/not-found.tsx
 * (an explicit notFound() from inside an already-matched page, e.g. a blog
 * slug with no post behind it). Same copy keys (notFoundPage.*) either way,
 * just centralizing the markup so both stay visually identical without
 * copy-pasting it.
 */
export function NotFoundView({
  locale,
  eyebrow,
  title,
  description,
  backHome,
  goToDashboard,
}: {
  locale: string;
  eyebrow: string;
  title: string;
  description: string;
  backHome: string;
  goToDashboard: string;
}) {
  return (
    <div className="ws-stamp flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 py-16 text-center">
      <Link href={`/${locale}`}>
        <LogoStamp className="text-lg" />
      </Link>

      <div className="ws-stamp-in -rotate-3 border-4 border-[var(--primary)] px-8 py-3 mt-10">
        <span className="text-5xl font-[900] text-[var(--primary)] md:text-6xl">{eyebrow}</span>
      </div>

      <h1 className="mt-8 text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">{description}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href={`/${locale}`} className={buttonVariants({ variant: "outline" })}>
          {backHome}
        </Link>
        <Link href={`/${locale}/dashboard`} className={buttonVariants({ className: "ws-stamp-in" })}>
          {goToDashboard}
        </Link>
      </div>
    </div>
  );
}
