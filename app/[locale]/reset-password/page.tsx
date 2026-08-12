"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthLocaleSelect } from "@/components/auth/auth-ui";
import { Input, Label } from "@/components/ui/input";
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
    supabase.auth.getSession().then(({ data }) => {
      setReady(data.session ? "valid" : "invalid");
    });
  }, []);

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] px-4 py-10">
      <div className="absolute end-4 top-4 md:end-6 md:top-6">
        <AuthLocaleSelect locale={locale} />
      </div>

      <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
        {done ? t("passwordUpdatedTitle") : t("resetPasswordTitle")}
      </h1>

      <div className="w-full max-w-[380px] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
        {ready === "checking" && <p className="text-center text-sm text-[var(--muted)]">…</p>}

        {ready === "invalid" && !done && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[var(--danger)]">{t("invalidResetLink")}</p>
            <Link
              href={`/${locale}/forgot-password`}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--primary)] text-[14px] font-semibold text-white hover:opacity-95"
            >
              {t("forgotPassword")}
            </Link>
          </div>
        )}

        {ready === "valid" && !done && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">{t("newPassword")}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder={t("newPasswordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-[14px] font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("updatePassword")}
            </button>
          </form>
        )}

        {done && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[var(--muted)]">{t("passwordUpdatedBody")}</p>
            <button
              type="button"
              onClick={() => router.push(destination)}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--primary)] text-[14px] font-semibold text-white hover:opacity-95"
            >
              {t("signIn")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--surface)]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
