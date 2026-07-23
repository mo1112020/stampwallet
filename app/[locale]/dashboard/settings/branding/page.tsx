"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { WalletPreview } from "@/components/wallet-preview/wallet-preview";
import type { Merchant, StampConfig } from "@/types";

const PREVIEW_CONFIG: StampConfig = {
  stamps_required: 10,
  reward_description: "Free item",
  icon: "☕",
};

export default function BrandingSettingsPage() {
  const t = useTranslations("settings.branding");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primary, setPrimary] = useState("#3E0856");
  const [secondary, setSecondary] = useState("#FAAE62");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/merchants/me")
      .then((r) => r.json())
      .then((json) => {
        const m = json.data as Merchant;
        setMerchant(m);
        setLogoUrl(m.logo_url);
        setPrimary(m.brand_color_primary);
        setSecondary(m.brand_color_secondary);
      });
  }, []);

  async function uploadLogo(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    setUploading(false);
    if (res.ok) setLogoUrl(json.url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings/merchant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logo_url: logoUrl,
        brand_color_primary: primary,
        brand_color_secondary: secondary,
      }),
    });
    setSaving(false);
    setMessage(res.ok ? t("saved") : t("saveFailed"));
  }

  if (!merchant) return <p className="text-sm text-[var(--muted)]">{t("loading")}</p>;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
        <div>
          <Label>{t("logo")}</Label>
          <div className="flex items-center gap-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-12 w-12 rounded-lg border border-[var(--line)] object-cover" />
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? t("uploading") : t("uploadLogo")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="primary">{t("primaryColor")}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-10 w-10 rounded border border-[var(--line)]"
            />
            <Input id="primary" value={primary} onChange={(e) => setPrimary(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="secondary">{t("secondaryColor")}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className="h-10 w-10 rounded border border-[var(--line)]"
            />
            <Input id="secondary" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
          </div>
        </div>
        {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
      </form>

      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--muted)]">{t("previewLabel")}</p>
        <WalletPreview
          type="stamp"
          config={PREVIEW_CONFIG}
          businessName={merchant.business_name}
          primaryColor={primary}
          secondaryColor={secondary}
        />
      </div>
    </div>
  );
}
