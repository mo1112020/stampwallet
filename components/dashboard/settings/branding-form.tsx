"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { WalletPreview } from "@/components/wallet-preview/wallet-preview";
import type { Merchant, StampConfig } from "@/types";

const PREVIEW_CONFIG: StampConfig = {
  stamps_required: 10,
  reward_description: "Free item",
  icon: "☕",
};

export function BrandingForm({ merchant }: { merchant: Merchant }) {
  const t = useTranslations("settings.branding");
  const [logoUrl, setLogoUrl] = useState<string | null>(merchant.logo_url);
  const [primary, setPrimary] = useState(merchant.brand_color_primary);
  const [secondary, setSecondary] = useState(merchant.brand_color_secondary);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadLogo(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    setUploading(false);
    if (res.ok) {
      setLogoUrl(json.url);
    } else {
      toast.error(json.error?.message ?? t("saveFailed"));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // A dropped/failed request (far more likely on a mobile connection than
    // on desktop wifi) used to throw out of this function before
    // setSaving(false) ran, leaving the button stuck disabled with no
    // feedback at all — looked exactly like a broken Save button on a phone.
    try {
      const res = await fetch("/api/settings/merchant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: logoUrl,
          brand_color_primary: primary,
          brand_color_secondary: secondary,
        }),
      });
      if (res.ok) {
        toast.success(t("saved"));
      } else {
        toast.error(t("saveFailed"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4">
        <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
        <div>
          <Label>{t("logo")}</Label>
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-2)]">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
