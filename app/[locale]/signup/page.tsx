"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  AuthLocaleSelect,
  AuthOrDivider,
  AuthSocialButtons,
} from "@/components/auth/auth-ui";
import { Input, Label } from "@/components/ui/input";

export default function SignupPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
      },
    });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    if (data.user) {
      await supabase.from("merchants").upsert({ id: data.user.id, business_name: businessName });
    }
    setLoading(false);
    router.push(`/${locale}/dashboard/onboarding`);
    router.refresh();
  }

  async function oauth(provider: "google" | "apple") {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard/onboarding`,
      },
    });
    if (err) {
      setLoading(false);
      setError(err.message);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10">
      <div className="absolute end-4 top-4 md:end-6 md:top-6">
        <AuthLocaleSelect locale={locale} />
      </div>

      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]">
        <span className="font-brand text-xs text-white">SW</span>
      </div>

      <h1 className="mb-6 text-center text-3xl font-bold tracking-tight text-[var(--ink)] md:text-4xl">
        {t("signUp")}
      </h1>

      <div className="w-full max-w-[380px] rounded-[24px] border border-[var(--line)] bg-white p-6 md:p-7">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input
                id="firstName"
                required
                autoComplete="given-name"
                placeholder={t("firstName")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input
                id="lastName"
                required
                autoComplete="family-name"
                placeholder={t("lastName")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
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
              autoComplete="new-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full bg-[var(--primary)] text-[14px] font-semibold text-white hover:opacity-95 disabled:opacity-50"
          >
            {t("continue")}
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
          {t("haveAccount")}{" "}
          <Link
            href={`/${locale}/login?form=1`}
            className="font-medium text-[var(--primary)] hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
