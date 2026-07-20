"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function localeHref(pathname: string, nextLocale: string) {
  const segments = pathname.split("/");
  if (segments[1] === "en" || segments[1] === "ar") {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}`;
}

export function AuthLocaleSelect({ locale }: { locale: string }) {
  const pathname = usePathname();
  const other = locale === "ar" ? "en" : "ar";
  const label = locale === "ar" ? "العربية" : "English";

  return (
    <Link
      href={localeHref(pathname, other)}
      hrefLang={other}
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-[13px] text-[var(--ink)] hover:border-[var(--ink)]/20"
    >
      {label}
      <ChevronDown size={14} className="opacity-50" />
    </Link>
  );
}

export function AuthLegalFooter({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  return (
    <p className="text-center text-[12px] text-[var(--muted)]">
      <Link href={`/${locale}/faq`} className="underline underline-offset-2 hover:text-[var(--ink)]">
        {t("termsOfUse")}
      </Link>
      <span className="mx-2 text-[var(--line-strong)]">|</span>
      <Link href={`/${locale}/faq`} className="underline underline-offset-2 hover:text-[var(--ink)]">
        {t("privacyPolicy")}
      </Link>
    </p>
  );
}

export function AuthOrDivider() {
  const t = useTranslations("auth");
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-[var(--line)]" />
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        {t("or")}
      </span>
      <div className="h-px flex-1 bg-[var(--line)]" />
    </div>
  );
}

export function AuthSocialButtons({
  onGoogle,
  onApple,
  loading,
}: {
  onGoogle: () => void;
  onApple: () => void;
  loading?: boolean;
}) {
  const t = useTranslations("auth");
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={onGoogle}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] bg-white text-[14px] font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] disabled:opacity-50"
        )}
      >
        <GoogleIcon />
        {t("continueGoogle")}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={onApple}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] bg-white text-[14px] font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] disabled:opacity-50"
      >
        <AppleIcon />
        {t("continueApple")}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
      <path d="M13.314 9.49c-.022-2.25 1.837-3.333 1.921-3.384-1.047-1.532-2.676-1.742-3.254-1.765-1.385-.14-2.703.815-3.406.815-.703 0-1.79-.795-2.943-.774-1.513.022-2.907.88-3.686 2.234-1.572 2.726-.402 6.763 1.13 8.977.75 1.084 1.644 2.302 2.818 2.258 1.13-.045 1.556-.73 2.922-.73 1.366 0 1.748.73 2.943.707 1.215-.022 1.986-1.105 2.73-2.194.86-1.258 1.214-2.476 1.235-2.538-.027-.013-2.37-.91-2.41-3.606ZM10.78 2.78C11.393 2.036 11.806.997 11.692 0c-.945.038-2.09.63-2.768 1.425-.607.704-1.14 1.827-1.0 2.903 1.057.082 2.137-.538 2.856-1.548Z" />
    </svg>
  );
}

export function AuthMediaPanel() {
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-[24px] bg-[var(--surface-2)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/auth-cover.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
