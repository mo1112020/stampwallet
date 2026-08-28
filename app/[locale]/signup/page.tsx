"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { AuthLocaleSelect } from "@/components/auth/auth-ui";
import { Logo } from "@/components/brand/logo";
import {
  AuthWarmButton,
  AuthWarmFieldError,
  AuthWarmInput,
  AuthWarmLabel,
  AuthWarmOrDivider,
  AuthWarmShell,
  AuthWarmSocialButtons,
} from "@/components/auth/auth-warm";
import { mapAuthErrorKey } from "@/lib/auth/error-messages";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit-check";
import { oauthOrigin } from "@/lib/auth/oauth-redirect";

export default function SignupPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | "apple" | null>(null);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setLoading("email");
    if (!(await checkAuthRateLimit("signup"))) {
      setLoading(null);
      setError(t("rateLimited"));
      return;
    }
    const businessName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/${locale}/dashboard/onboarding`,
      },
    });
    if (err) {
      setLoading(null);
      const key = mapAuthErrorKey(err.message);
      setError(key ? t(key) : err.message);
      return;
    }
    if (data.user) {
      await supabase.from("merchants").upsert({ id: data.user.id, business_name: businessName });
      // Best-effort — a failed welcome email must never block signup itself.
      fetch("/api/auth/post-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id }),
      }).catch(() => {});
    }
    setLoading(null);
    router.push(`/${locale}/dashboard/onboarding`);
    router.refresh();
  }

  async function oauth(provider: "google" | "apple") {
    setLoading(provider);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${oauthOrigin()}/auth/callback?next=/${locale}/dashboard/onboarding`,
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
    <AuthWarmShell brandVariant="signup">
      <div className="flex items-center justify-between">
        <Logo className="h-6" />
        <AuthLocaleSelect
          locale={locale}
          triggerClassName="w-auto rounded-full border border-[var(--aw-line)] bg-[var(--aw-input-bg)] px-3.5 py-1.5 text-[13px] text-[var(--aw-ink)] hover:border-[var(--aw-accent)]"
        />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[38px] leading-[1.05] sm:text-[46px]">{t("signupTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[var(--aw-muted)]">{t("signUpSubtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <AuthWarmLabel htmlFor="firstName">{t("firstName")}</AuthWarmLabel>
              <AuthWarmInput
                id="firstName"
                required
                autoComplete="given-name"
                disabled={loading === "email"}
                placeholder={t("firstName")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <AuthWarmLabel htmlFor="lastName">{t("lastName")}</AuthWarmLabel>
              <AuthWarmInput
                id="lastName"
                required
                autoComplete="family-name"
                disabled={loading === "email"}
                placeholder={t("lastName")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <AuthWarmLabel htmlFor="password">{t("password")}</AuthWarmLabel>
              <AuthWarmInput
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading === "email"}
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <AuthWarmLabel htmlFor="confirmPassword">{t("confirmPassword")}</AuthWarmLabel>
              <AuthWarmInput
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                invalid={mismatch}
                disabled={loading === "email"}
                placeholder={t("confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {mismatch && <AuthWarmFieldError>{t("passwordMismatch")}</AuthWarmFieldError>}
            </div>
          </div>

          {error && <p className="text-sm text-[var(--aw-danger)]">{error}</p>}

          <AuthWarmButton type="submit" disabled={busy} loading={loading === "email"}>
            {t("continue")}
          </AuthWarmButton>
          <p className="text-[12px] leading-relaxed text-[var(--aw-muted-2)]">{t("signupLegal")}</p>
        </form>

        <AuthWarmOrDivider />

        <AuthWarmSocialButtons
          disabled={busy}
          loadingProvider={loading === "google" || loading === "apple" ? loading : null}
          onGoogle={() => oauth("google")}
          onApple={() => oauth("apple")}
        />

        <p className="text-[14px] text-[var(--aw-muted)]">
          {t("haveAccount")}{" "}
          <Link href={`/${locale}/login`} className="text-[var(--aw-ink)] underline underline-offset-[3px]">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </AuthWarmShell>
  );
}
