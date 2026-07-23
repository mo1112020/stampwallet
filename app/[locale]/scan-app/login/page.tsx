"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Input, Label } from "@/components/ui/input";

export default function ScanAppLoginPage() {
  const t = useTranslations("scanner");
  const tAuth = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(`/${locale}/scan-app`);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <p className="font-brand text-sm text-white/80">StampWallet</p>
      <h1 className="mt-2 text-2xl font-semibold">{t("staffLogin")}</h1>

      <form onSubmit={onSubmit} className="mt-8 w-full max-w-[340px] space-y-4">
        <div>
          <Label htmlFor="email" className="text-white/70">
            {tAuth("email")}
          </Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white text-[var(--ink)]"
          />
        </div>
        <div>
          <Label htmlFor="password" className="text-white/70">
            {tAuth("password")}
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white text-[var(--ink)]"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-white text-[14px] font-semibold text-[var(--ink)] hover:opacity-90 disabled:opacity-50"
        >
          {tAuth("continueEmail")}
        </button>
      </form>
    </main>
  );
}
