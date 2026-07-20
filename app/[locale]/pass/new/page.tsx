"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function EnrollForm() {
  const t = useTranslations("enroll");
  const params = useParams();
  const search = useSearchParams();
  const programId = search.get("program") ?? "";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [passId, setPassId] = useState<string | null>(null);
  const [appleUrl, setAppleUrl] = useState<string | null>(null);
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!programId) {
      setError("Missing program id");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/customers/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        program_id: programId,
        name: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Enrollment failed");
      return;
    }
    setPassId(json.data.pass_id);
    setAppleUrl(json.data.apple_pass_url);
    setGoogleUrl(json.data.google_wallet_url);
  }

  if (passId) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-semibold text-[var(--brand)]">Your pass is ready</p>
        <p className="text-sm text-[var(--muted)] break-all">Pass ID: {passId}</p>
        <div className="flex flex-col gap-3">
          {appleUrl && (
            <a href={appleUrl} className="rounded-full bg-[var(--primary)] px-4 py-3 font-semibold text-white">
              {t("addApple")}
            </a>
          )}
          {googleUrl && (
            <a href={googleUrl} className="rounded-lg bg-[var(--brand)] px-4 py-3 text-white">
              {t("addGoogle")}
            </a>
          )}
          <a
            href={`/${params.locale}/pass/${passId}`}
            className="text-sm text-[var(--brand)] underline"
          >
            View progress page
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || !programId}>
        {t("submit")}
      </Button>
    </form>
  );
}

export default function EnrollPage() {
  const t = useTranslations("enroll");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
        {t("title")}
      </h1>
      <div className="mt-8">
        <Suspense fallback={<p>Loading…</p>}>
          <EnrollForm />
        </Suspense>
      </div>
    </main>
  );
}
