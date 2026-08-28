"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  AuthWarmButton,
  AuthWarmCardShell,
  AuthWarmFieldError,
  AuthWarmInput,
  AuthWarmLabel,
} from "@/components/auth/auth-warm";
import { mapAuthErrorKey } from "@/lib/auth/error-messages";

function ResetPasswordContent() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [ready, setReady] = useState<"checking" | "valid" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // When the account has a verified TOTP factor, GoTrue rejects
  // updateUser({ password }) with a 401 ("AAL2 session is required to update
  // email or password when MFA is enabled") until the recovery session —
  // which lands at aal1 — is elevated to aal2 by passing an authenticator
  // challenge. `needsMfa` gates the password form behind that step.
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  // "staff"-role accounts only have the scan capability in /dashboard (see
  // lib/auth/permissions.ts) — they belong in the scan-app PWA instead,
  // which is also where the "install to your phone" prompt lives. Defaults
  // to the dashboard (the previous, and still correct-for-most-users,
  // behavior) if the role lookup fails for any reason.
  const [destination, setDestination] = useState<string>(`/${locale}/dashboard`);

  useEffect(() => {
    // /auth/callback already exchanged the recovery code for a session by
    // the time this page loads — a real recovery session must be present,
    // or the link was already used/expired.
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setReady("invalid");
        return;
      }
      setReady("valid");

      // aal1 + nextLevel aal2 => a verified authenticator exists but this
      // (recovery) session hasn't satisfied it yet.
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verified = factors?.totp?.[0];
        if (verified) {
          setMfaFactorId(verified.id);
          setNeedsMfa(true);
        }
        // No verified factor to challenge (unusual): fall through and let
        // updateUser surface the real error rather than trapping the user.
      }
    })();
  }, []);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactorId) {
      setMfaError(t("mfaNoFactor"));
      return;
    }
    setMfaVerifying(true);
    setMfaError(null);
    const supabase = createClient();
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId: mfaFactorId,
    });
    if (challengeErr || !challenge) {
      setMfaVerifying(false);
      setMfaError(challengeErr?.message ?? t("mfaInvalidCode"));
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode,
    });
    setMfaVerifying(false);
    if (verifyErr) {
      setMfaError(t("mfaInvalidCode"));
      return;
    }
    // Session is now aal2 — reveal the password form.
    setNeedsMfa(false);
    setMfaCode("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      const key = mapAuthErrorKey(err.message);
      setError(key ? t(key) : err.message);
      return;
    }
    setDone(true);
    try {
      const res = await fetch("/api/auth/session-role");
      if (res.ok) {
        const json = await res.json();
        if (json.data?.role === "staff") setDestination(`/${locale}/scan-app`);
      }
    } catch {
      // Falls back to the /dashboard default already set on `destination`.
    }
  }

  return (
    <AuthWarmCardShell locale={locale}>
      {ready === "checking" && <p className="text-center text-sm text-[var(--aw-muted)]">…</p>}

      {ready === "invalid" && !done && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--aw-danger)]">{t("invalidResetLink")}</p>
          <Link href={`/${locale}/forgot-password`}>
            <AuthWarmButton type="button">{t("forgotPassword")}</AuthWarmButton>
          </Link>
        </div>
      )}

      {ready === "valid" && !done && needsMfa && (
        <form onSubmit={verifyMfa} className="flex flex-col gap-5">
          <h1 className="text-[32px] leading-[1.1]">{t("mfaResetTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[var(--aw-muted)]">{t("mfaResetBody")}</p>
          <div>
            <AuthWarmLabel htmlFor="mfaCode">{t("mfaCodeLabel")}</AuthWarmLabel>
            <AuthWarmInput
              id="mfaCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              disabled={mfaVerifying}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {mfaError && <p className="text-sm text-[var(--aw-danger)]">{mfaError}</p>}
          <AuthWarmButton
            type="submit"
            disabled={mfaVerifying || mfaCode.length !== 6}
            loading={mfaVerifying}
          >
            {t("mfaVerify")}
          </AuthWarmButton>
        </form>
      )}

      {ready === "valid" && !done && !needsMfa && (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <h1 className="text-[32px] leading-[1.1]">{t("resetPasswordTitle")}</h1>
          <div>
            <AuthWarmLabel htmlFor="password">{t("newPassword")}</AuthWarmLabel>
            <AuthWarmInput
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={loading}
              placeholder={t("newPasswordPlaceholder")}
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
              disabled={loading}
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {mismatch && <AuthWarmFieldError>{t("passwordMismatch")}</AuthWarmFieldError>}
          </div>
          {error && <p className="text-sm text-[var(--aw-danger)]">{error}</p>}
          <AuthWarmButton type="submit" disabled={loading} loading={loading}>
            {t("updatePassword")}
          </AuthWarmButton>
        </form>
      )}

      {done && (
        <div className="flex flex-col gap-4">
          <h1 className="text-[32px] leading-[1.1]">{t("passwordUpdatedTitle")}</h1>
          <p className="text-[15px] leading-relaxed text-[var(--aw-muted)]">{t("passwordUpdatedBody")}</p>
          <AuthWarmButton type="button" onClick={() => router.push(destination)}>
            {t("signIn")}
          </AuthWarmButton>
        </div>
      )}
    </AuthWarmCardShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="authwarm min-h-screen" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
