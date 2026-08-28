"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AuthLocaleSelect } from "@/components/auth/auth-ui";
import { Logo } from "@/components/brand/logo";
import {
  AuthWarmButton,
  AuthWarmCheckbox,
  AuthWarmInput,
  AuthWarmLabel,
  AuthWarmOrDivider,
  AuthWarmShell,
  AuthWarmSocialButtons,
} from "@/components/auth/auth-warm";
import { mapAuthErrorKey } from "@/lib/auth/error-messages";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit-check";
import { oauthOrigin } from "@/lib/auth/oauth-redirect";

function LoginContent() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Purely presentational — Supabase's browser client already persists the
  // session across visits by default, so there's no separate "don't
  // remember me" storage mode to wire this to.
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? t("authError") : null
  );
  const [loading, setLoading] = useState<"email" | "google" | "apple" | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    if (!(await checkAuthRateLimit("login"))) {
      setLoading(null);
      setError(t("rateLimited"));
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setLoading(null);
      const key = mapAuthErrorKey(err.message);
      setError(key ? t(key) : err.message);
      return;
    }
    // "staff"-role accounts only have the scan capability in /dashboard
    // (lib/auth/permissions.ts) — same reasoning/fix as
    // app/[locale]/reset-password/page.tsx. Falls back to /dashboard (the
    // previous, still-correct-for-most-users behavior) if this lookup fails.
    let destination = `/${locale}/dashboard`;
    try {
      const res = await fetch("/api/auth/session-role");
      if (res.ok) {
        const json = await res.json();
        if (json.data?.role === "staff") destination = `/${locale}/scan-app`;
      }
    } catch {
      // Falls back to the /dashboard default already set above.
    }
    router.push(destination);
    router.refresh();
  }

  async function oauth(provider: "google" | "apple") {
    setLoading(provider);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${oauthOrigin()}/auth/callback?next=/${locale}/dashboard`,
      },
    });
    if (err) {
      setLoading(null);
      const key = mapAuthErrorKey(err.message);
      setError(key ? t(key) : err.message);
    }
  }

  const busy = loading !== null;

  return (
    <AuthWarmShell brandVariant="signin">
      <div className="flex items-center justify-between">
        <Logo className="h-6" />
        <AuthWarmLocaleSelectSlot locale={locale} />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-7">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[38px] leading-[1.05] sm:text-[46px]">{t("loginTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[var(--aw-muted)]">{t("signInSubtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <AuthWarmLabel htmlFor="email">{t("email")}</AuthWarmLabel>
            <AuthWarmInput
              id="email"
              type="email"
              required
              autoComplete="email"
              disabled={loading === "email"}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <AuthWarmLabel htmlFor="password" className="mb-0">
                {t("password")}
              </AuthWarmLabel>
              <Link href={`/${locale}/forgot-password`} className="text-[13px] text-[var(--aw-accent)] underline underline-offset-[3px]">
                {t("forgotPassword")}
              </Link>
            </div>
            <AuthWarmInput
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              disabled={loading === "email"}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <AuthWarmCheckbox
            id="keepSignedIn"
            checked={keepSignedIn}
            onChange={setKeepSignedIn}
            label={t("keepSignedIn")}
          />

          {error && <p className="text-sm text-[var(--aw-danger)]">{error}</p>}

          <AuthWarmButton type="submit" disabled={busy} loading={loading === "email"}>
            {loading === "email" ? t("signingIn") : t("signIn")}
          </AuthWarmButton>
        </form>

        <AuthWarmOrDivider />

        <AuthWarmSocialButtons
          disabled={busy}
          loadingProvider={loading === "google" || loading === "apple" ? loading : null}
          onGoogle={() => oauth("google")}
          onApple={() => oauth("apple")}
        />

        <p className="text-[14px] text-[var(--aw-muted)]">
          {t("needAccount")}{" "}
          <Link href={`/${locale}/signup`} className="text-[var(--aw-ink)] underline underline-offset-[3px]">
            {t("signUp")}
          </Link>
        </p>
      </div>

      <div className="flex gap-5 text-[12px] text-[var(--aw-placeholder)]">
        <Link href={`/${locale}/faq`} className="hover:text-[var(--aw-ink)]">
          {t("termsOfUse")}
        </Link>
        <Link href={`/${locale}/faq`} className="hover:text-[var(--aw-ink)]">
          {t("privacyPolicy")}
        </Link>
      </div>
    </AuthWarmShell>
  );
}

/** Wraps AuthLocaleSelect with the warm-theme trigger styling — kept local
 * to this page since signup doesn't show the switcher in the header row. */
function AuthWarmLocaleSelectSlot({ locale }: { locale: string }) {
  return (
    <AuthLocaleSelect
      locale={locale}
      triggerClassName="w-auto rounded-full border border-[var(--aw-line)] bg-[var(--aw-input-bg)] px-3.5 py-1.5 text-[13px] text-[var(--aw-ink)] hover:border-[var(--aw-accent)]"
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="authwarm min-h-screen" />}>
      <LoginContent />
    </Suspense>
  );
}
