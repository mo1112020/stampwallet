"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import type { Merchant } from "@/types";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Africa/Cairo",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Karachi",
];

export default function ProfileSettingsPage() {
  const t = useTranslations("settings.profile");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [locale, setLocaleField] = useState<"en" | "ar">("en");
  const [timezone, setTimezone] = useState("UTC");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/merchants/me")
      .then((r) => r.json())
      .then((json) => {
        const m = json.data as Merchant;
        setMerchant(m);
        setBusinessName(m.business_name);
        setIndustry(m.industry);
        setLocaleField(m.locale_default);
        setTimezone(m.timezone);
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/merchant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          industry,
          locale_default: locale,
          timezone,
        }),
      });
      if (res.ok) {
        toast.success(t("saved"));
      } else {
        toast.error(t("saveFailed"));
      }
    } finally {
      setSaving(false);
    }
  }

  if (!merchant) {
    return (
      <div className="max-w-md space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-28" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="business_name">{t("businessName")}</Label>
        <Input
          id="business_name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="industry">{t("industry")}</Label>
        <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="locale">{t("language")}</Label>
        <Select
          id="locale"
          value={locale}
          onChange={(e) => setLocaleField(e.target.value as "en" | "ar")}
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="timezone">{t("timezone")}</Label>
        <Select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
