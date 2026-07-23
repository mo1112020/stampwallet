"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("coffee_shop");
  const [primary, setPrimary] = useState("#3E0856");
  const [secondary, setSecondary] = useState("#FAAE62");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/merchants/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: businessName,
        industry,
        brand_color_primary: primary,
        brand_color_secondary: secondary,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Failed");
      return;
    }
    router.push(`/${locale}/dashboard/programs/new`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--primary)]">
        {t("title")}
      </h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="name">Business name</Label>
          <Input id="name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="industry">{t("industry")}</Label>
          <Input id="industry" required value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary">{t("primaryColor")}</Label>
            <Input id="primary" type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="secondary">{t("secondaryColor")}</Label>
            <Input id="secondary" type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <Button type="submit" disabled={loading}>
          {t("continue")}
        </Button>
      </form>
    </div>
  );
}
