"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  AuthWarmButton,
  AuthWarmCardShell,
  AuthWarmInput,
  AuthWarmLabel,
} from "@/components/auth/auth-warm";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit-check";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Rate-limited before the real resetPasswordForEmail call — the only
    // error case worth surfacing here, since a real send failure below is
    // deliberately swallowed (see the comment there) to avoid revealing
    // whether an email is registered.
    if (!(await checkAuthRateLimit("password_reset"))) {
      setLoading(false);
      setError(t("rateLimited"));
      return;
    }
    const supabase = createClient();
    // Errors here are deliberately not surfaced — the confirmation message
    // is identical whether or not the email exists, so this can't be used
    // to enumerate registered accounts.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <AuthWarmCardShell locale={locale}>
      {sent ? (
        <div className="flex flex-col gap-4">
          <h1 className="text-[32px] leading-[1.1]">{t("resetLinkSentTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[var(--aw-muted)]">{t("resetLinkSentBody")}</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <Link href={`/${locale}/login`} className="text-[14px] text-[var(--aw-muted)]">
            &larr; {t("backToLogin")}
          </Link>
          <h1 className="text-[32px] leading-[1.1]">{t("forgotPasswordTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[var(--aw-muted)]">{t("forgotPasswordBody")}</p>
          <div>
            <AuthWarmLabel htmlFor="email">{t("email")}</AuthWarmLabel>
            <AuthWarmInput
              id="email"
              type="email"
              required
              autoComplete="email"
              disabled={loading}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-[var(--aw-danger)]">{error}</p>}
          <AuthWarmButton type="submit" disabled={loading} loading={loading}>
            {t("sendResetLink")}
          </AuthWarmButton>
        </form>
      )}

      {sent && (
        <p className="mt-6 text-[14px] text-[var(--aw-muted)]">
          <Link href={`/${locale}/login`} className="text-[var(--aw-ink)] underline underline-offset-[3px]">
            {t("backToLogin")}
          </Link>
        </p>
      )}
    </AuthWarmCardShell>
  );
}
