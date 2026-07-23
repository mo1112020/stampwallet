"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { path: "about", key: "about" as const },
  { path: "features", key: "features" as const },
  { path: "industries", key: "industries" as const },
  { path: "infrastructure", key: "infrastructure" as const },
  { path: "pricing", key: "pricing" as const },
  { path: "faq", key: "faq" as const },
];

function localeHref(pathname: string, nextLocale: string) {
  const segments = pathname.split("/");
  if (segments[1] === "en" || segments[1] === "ar") {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}`;
}

export function MarketingHeader({ locale }: { locale: string }) {
  const t = useTranslations("site.nav");
  const nav = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const otherLocale = locale === "ar" ? "en" : "ar";

  function hrefFor(path: string) {
    return path ? `/${locale}/${path}` : `/${locale}`;
  }

  function isActive(path: string) {
    const href = hrefFor(path);
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/10 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:pt-5">
        <header className="mx-auto flex h-14 max-w-5xl items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)]/90 px-3 shadow-sm backdrop-blur-xl md:h-14 md:px-4">
          <Link
            href={`/${locale}`}
            className="font-brand shrink-0 px-2 text-sm text-[var(--ink)] md:text-[15px]"
          >
            StampWallet
          </Link>

          <nav className="mx-auto hidden items-center gap-0.5 text-[13px] lg:flex">
            {links.map((item) => (
              <Link
                key={item.key}
                href={hrefFor(item.path)}
                className={cn(
                  "rounded-full px-3 py-1.5",
                  isActive(item.path)
                    ? "bg-[var(--surface-3)] font-medium text-[var(--ink)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="ms-auto hidden items-center gap-1.5 md:flex">
            <Link
              href={localeHref(pathname, otherLocale)}
              className="rounded-full px-2.5 py-1.5 text-[12px] font-medium uppercase tracking-wide text-[var(--muted)] hover:text-[var(--ink)]"
              hrefLang={otherLocale}
            >
              {otherLocale}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-full px-3 py-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {nav("login")}
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-95"
            >
              {nav("signup")}
            </Link>
          </div>

          <button
            type="button"
            className="ms-auto flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--surface-2)] active:bg-[var(--surface-3)] touch-manipulation select-none outline-none [-webkit-tap-highlight-color:transparent] md:ms-0 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
          </button>
        </header>

        {open && (
          <div className="mx-auto mt-3 max-w-5xl rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-sm lg:hidden">
            <nav className="flex flex-col gap-0.5">
              <Link
                href={`/${locale}`}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm text-[var(--ink)]"
              >
                {t("home")}
              </Link>
              {links.map((item) => (
                <Link
                  key={item.key}
                  href={hrefFor(item.path)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm",
                    isActive(item.path) ? "bg-[var(--surface-3)] font-medium" : "text-[var(--muted)]"
                  )}
                >
                  {t(item.key)}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex items-center gap-2 border-t border-[var(--line)] pt-3">
              <Link
                href={`/${locale}/login`}
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-2 text-sm text-[var(--muted)]"
              >
                {nav("login")}
              </Link>
              <Link
                href={`/${locale}/signup`}
                onClick={() => setOpen(false)}
                className="ms-auto rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white"
              >
                {nav("signup")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
