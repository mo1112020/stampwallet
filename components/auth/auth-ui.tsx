"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GoogleIcon, AppleIcon } from "@/components/auth/auth-icons";

/** Same dropdown used everywhere else in the app (mobile nav, dashboard
 * topbar) — was previously a plain Link that swapped locale on click with
 * no open/close affordance at all, despite showing a chevron that implied
 * one. */
export function AuthLocaleSelect({
  locale,
  triggerClassName,
}: {
  locale: string;
  triggerClassName?: string;
}) {
  return (
    <LanguageSwitcher
      locale={locale}
      className="w-auto"
      triggerClassName={
        triggerClassName ??
        "w-auto rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-[13px] hover:border-[var(--ink)]/20 hover:bg-[var(--surface)]"
      }
    />
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
  disabled,
  loadingProvider,
}: {
  onGoogle: () => void;
  onApple: () => void;
  /** Disables both buttons while any auth action (including the email
   * form) is in flight, to prevent a second submission racing the first. */
  disabled?: boolean;
  /** Which button shows its own spinner — distinct from `disabled` so
   * clicking Google doesn't also spin the untouched Apple button. */
  loadingProvider?: "google" | "apple" | null;
}) {
  const t = useTranslations("auth");
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onGoogle}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
        )}
      >
        {loadingProvider === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {t("continueGoogle")}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onApple}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
      >
        {loadingProvider === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon />}
        {t("continueApple")}
      </button>
    </div>
  );
}
