"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  AuthLegalFooter,
  AuthLocaleSelect,
  AuthMediaPanel,
  AuthOrDivider,
  AuthSocialButtons,
} from "@/components/auth/auth-ui";
import { Input, Label } from "@/components/ui/input";
import { mapAuthErrorKey } from "@/lib/auth/error-messages";

function LoginContent() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"welcome" | "form">(
    searchParams.get("form") === "1" ? "form" : "welcome"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? t("authError") : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      const key = mapAuthErrorKey(err.message);
      setError(key ? t(key) : err.message);
      return;
    }
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  async function oauth(provider: "google" | "apple") {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard`,
      },
    });
    if (err) {
      setLoading(false);
      const key = mapAuthErrorKey(err.message);
      setError(key ? t(key) : err.message);
    }
  }

  if (step === "welcome") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4 py-6 md:px-6">
        <div className="mx-auto grid w-full max-w-[920px] overflow-hidden rounded-[28px] border border-[var(--line)] lg:grid-cols-2 lg:min-h-[560px]">
          <div className="hidden p-3 lg:block">
            <AuthMediaPanel />
          </div>

          <div className="relative flex flex-col px-6 py-6 md:px-10 md:py-8">
            <div className="flex justify-end">
              <AuthLocaleSelect locale={locale} />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center py-10 md:py-12">
              <h1 className="text-center text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
                {t("welcomeBack")}
              </h1>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="mt-8 h-12 w-full max-w-[280px] rounded-full bg-[var(--primary)] text-[15px] font-semibold text-white hover:opacity-95"
              >
                {t("signIn")}
              </button>
            </div>

            <AuthLegalFooter locale={locale} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface)] px-4 py-10">
      <div className="absolute end-4 top-4 md:end-6 md:top-6">
        <AuthLocaleSelect locale={locale} />
      </div>

      <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
        {t("signIn")}
      </h1>

      <div className="w-full max-w-[380px] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 md:p-7">
        <form onSubmit={onSubmit} className="space-y-4">
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
          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-[14px] font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("continueEmail")}
          </button>
        </form>

        <div className="my-4">
          <AuthOrDivider />
        </div>

        <AuthSocialButtons
          loading={loading}
          onGoogle={() => oauth("google")}
          onApple={() => oauth("apple")}
        />

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          {t("needAccount")}{" "}
          <Link href={`/${locale}/signup`} className="font-medium text-[var(--primary)] hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </div>

      <p className="mt-8 text-center text-[12px] text-[var(--muted)]">{t("termsAndPrivacy")}</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--surface)]" />}>
      <LoginContent />
    </Suspense>
  );
}
