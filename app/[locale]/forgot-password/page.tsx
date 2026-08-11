"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthLocaleSelect } from "@/components/auth/auth-ui";
import { Input, Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] px-4 py-10">
      <div className="absolute end-4 top-4 md:end-6 md:top-6">
        <AuthLocaleSelect locale={locale} />
      </div>

      <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
        {sent ? t("resetLinkSentTitle") : t("forgotPasswordTitle")}
      </h1>

      <div className="w-full max-w-[380px] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
        {sent ? (
          <p className="text-center text-sm text-[var(--muted)]">{t("resetLinkSentBody")}</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-sm text-[var(--muted)]">{t("forgotPasswordBody")}</p>
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-[14px] font-semibold text-white hover:opacity-95 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("sendResetLink")}
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          <Link href={`/${locale}/login?form=1`} className="font-medium text-[var(--primary)] hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </main>
  );
}
