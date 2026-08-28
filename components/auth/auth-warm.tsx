"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLocaleSelect } from "@/components/auth/auth-ui";
import { GoogleIcon, AppleIcon } from "@/components/auth/auth-icons";

/**
 * "Counter" auth theme — warm paper & amber, imported from the WalletOS
 * Auth design (claude.ai/design, design 1b). Scoped entirely to .authwarm
 * (see app/globals.css) so it never touches the product UI's blue theme.
 * Deliberately its own set of primitives rather than the shared
 * components/ui ones — this design's fields and CTAs are small-radius
 * rectangles, not the product UI's pills.
 */

export function AuthWarmFontLinks() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
        rel="stylesheet"
      />
    </>
  );
}

export const AuthWarmInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded border bg-[var(--aw-input-bg)] px-4 text-[15px] text-[var(--aw-ink)] placeholder:text-[var(--aw-placeholder)]",
      "border-[var(--aw-line)] focus-visible:outline-none focus-visible:border-[var(--aw-accent)] focus-visible:ring-4 focus-visible:ring-[var(--aw-accent-soft)]",
      invalid && "border-[1.5px] border-[var(--aw-danger)] ring-4 ring-[var(--aw-danger-soft)]",
      "disabled:border-[var(--aw-line-soft)] disabled:bg-[var(--aw-input-bg-disabled)] disabled:text-[var(--aw-placeholder)]",
      className
    )}
    {...props}
  />
));
AuthWarmInput.displayName = "AuthWarmInput";

export function AuthWarmLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[13px] font-medium text-[var(--aw-label)]", className)}
      {...props}
    />
  );
}

export function AuthWarmFieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-[12px] text-[var(--aw-danger)]">{children}</p>;
}

export function AuthWarmCheckbox({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--aw-label)]">
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[3px] text-[11px] transition-colors",
          checked
            ? "bg-[var(--aw-ink)] text-[var(--aw-bg)]"
            : "border border-[var(--aw-line)] bg-[var(--aw-input-bg)]"
        )}
      >
        {checked && "✓"}
      </button>
      {label}
    </label>
  );
}

export function AuthWarmButton({
  className,
  loading,
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "outline";
}) {
  return (
    <button
      className={cn(
        "flex h-[50px] w-full items-center justify-center gap-2 rounded text-[15px] font-medium transition-opacity disabled:opacity-50",
        variant === "primary"
          ? "bg-[var(--aw-ink)] text-[var(--aw-bg)] hover:opacity-95"
          : "border border-[var(--aw-line)] bg-[var(--aw-input-bg)] text-[var(--aw-ink)] hover:bg-[var(--aw-line-soft)]/30",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function AuthWarmOrDivider() {
  const t = useTranslations("auth");
  return (
    <div className="flex items-center gap-3.5 py-1 text-[12px] text-[var(--aw-placeholder)]">
      <div className="h-px flex-1 bg-[var(--aw-line-soft)]" />
      {t("or")}
      <div className="h-px flex-1 bg-[var(--aw-line-soft)]" />
    </div>
  );
}

export function AuthWarmSocialButtons({
  onGoogle,
  onApple,
  disabled,
  loadingProvider,
}: {
  onGoogle: () => void;
  onApple: () => void;
  disabled?: boolean;
  loadingProvider?: "google" | "apple" | null;
}) {
  const t = useTranslations("auth");
  return (
    <div className="grid grid-cols-2 gap-3">
      <AuthWarmButton type="button" variant="outline" disabled={disabled} onClick={onGoogle} className="h-12 text-[14px]">
        {loadingProvider === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        {t("continueGoogle")}
      </AuthWarmButton>
      <AuthWarmButton type="button" variant="outline" disabled={disabled} onClick={onApple} className="h-12 text-[14px]">
        {loadingProvider === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleIcon />}
        {t("continueApple")}
      </AuthWarmButton>
    </div>
  );
}

/** Dark brown brand panel, right column on desktop, hidden below lg.
 * Two content variants matching the design's sign-in and sign-up screens. */
export function AuthWarmBrandPanel({ variant }: { variant: "signin" | "signup" }) {
  const t = useTranslations("auth");
  return (
    <div className="hidden flex-col justify-between bg-[var(--aw-panel-bg)] p-14 lg:flex">
      {variant === "signin" ? (
        <p className="aw-serif max-w-[300px] text-[22px] italic leading-snug text-[var(--aw-panel-accent)]">
          {t("brandTagline")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--aw-panel-muted)]">{t("brandEyebrowSignup")}</p>
          <h2 className="aw-serif max-w-[380px] text-[34px] leading-[1.15] text-[var(--aw-panel-ink)]">
            {t("brandHeadlineSignup")}
          </h2>
        </div>
      )}

      {variant === "signin" ? (
        <div className="flex flex-col items-center gap-8">
          <AuthWarmStampCard />
          <div className="max-w-[340px] text-center">
            <h3 className="aw-serif text-[24px] text-[var(--aw-panel-ink)]">{t("brandHeadline")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--aw-panel-muted)]">{t("brandBody")}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <AuthWarmStep n={1} title={t("brandStep1Title")} body={t("brandStep1Body")} />
          <AuthWarmStep n={2} title={t("brandStep2Title")} body={t("brandStep2Body")} />
          <AuthWarmStep n={3} title={t("brandStep3Title")} body={t("brandStep3Body")} />
        </div>
      )}

      {variant === "signin" ? (
        <div className="flex gap-6 text-[12px] text-[var(--aw-panel-muted)]">
          <span>{t("brandWalletApple")}</span>
          <span>{t("brandWalletGoogle")}</span>
        </div>
      ) : (
        <p className="aw-serif max-w-[340px] border-t border-[var(--aw-panel-line)] pt-6 text-[18px] italic leading-relaxed text-[var(--aw-panel-accent)]">
          {t("brandQuoteSignup")}
        </p>
      )}
    </div>
  );
}

function AuthWarmStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--aw-panel-line)] text-[12px] text-[var(--aw-panel-accent)]">
        {n}
      </div>
      <div>
        <p className="text-[15px] text-[var(--aw-panel-ink)]">{title}</p>
        <p className="mt-1 max-w-[280px] text-[13px] leading-relaxed text-[var(--aw-panel-muted)]">{body}</p>
      </div>
    </div>
  );
}

/** Decorative wallet-pass mockup — sample data, not tied to the signed-in
 * merchant's real card (this is a logged-out page). */
function AuthWarmStampCard() {
  const t = useTranslations("auth");
  const filled = 7;
  const total = 10;
  return (
    <div className="flex w-[280px] flex-col gap-4 rounded-2xl bg-[var(--aw-input-bg)] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2.5">
        <div
          className="h-8 w-8 rounded-full"
          style={{ background: "repeating-linear-gradient(135deg, #e5dac8 0 4px, #f4ece0 4px 8px)" }}
        />
        <div>
          <p className="aw-serif text-[16px] text-[var(--aw-ink)]">{t("brandDemoBusiness")}</p>
          <p className="text-[11px] text-[var(--aw-muted-2)]">{t("brandDemoCategory")}</p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-full",
              i < filled ? "bg-[var(--aw-accent)]" : "border border-dashed border-[var(--aw-line)]"
            )}
          />
        ))}
      </div>
      <p className="text-[13px] text-[var(--aw-label)]">{t("brandDemoProgress")}</p>
      <div
        className="h-11 rounded-md"
        style={{ background: "repeating-linear-gradient(90deg, var(--aw-ink) 0 2px, var(--aw-input-bg) 2px 5px)" }}
      />
    </div>
  );
}

/** Two-column shell (form + brand panel) used by login and signup. */
export function AuthWarmShell({
  brandVariant,
  children,
}: {
  brandVariant: "signin" | "signup";
  children: React.ReactNode;
}) {
  return (
    <main className="authwarm flex min-h-screen items-center justify-center px-4 py-8">
      <AuthWarmFontLinks />
      <div
        className="grid w-full max-w-[1120px] overflow-hidden rounded-2xl lg:grid-cols-[1.05fr_1fr]"
        style={{ boxShadow: "var(--aw-shadow)" }}
      >
        <div className="flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-14">{children}</div>
        <AuthWarmBrandPanel variant={brandVariant} />
      </div>
    </main>
  );
}

/** Centered single-card shell used by forgot-password / reset-password. */
export function AuthWarmCardShell({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <main className="authwarm flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <AuthWarmFontLinks />
      <div className="absolute end-4 top-4 md:end-6 md:top-6">
        <AuthLocaleSelect
          locale={locale}
          triggerClassName="w-auto rounded-full border border-[var(--aw-line)] bg-[var(--aw-input-bg)] px-3.5 py-1.5 text-[13px] text-[var(--aw-ink)] hover:border-[var(--aw-accent)]"
        />
      </div>
      <div
        className="w-full max-w-[440px] rounded-2xl bg-[var(--aw-bg)] px-7 py-9 sm:px-10 sm:py-10"
        style={{ boxShadow: "var(--aw-shadow)" }}
      >
        {children}
      </div>
    </main>
  );
}
