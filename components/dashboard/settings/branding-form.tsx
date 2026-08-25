"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import type { Merchant } from "@/types";

export function BrandingForm({ merchant }: { merchant: Merchant }) {
  const t = useTranslations("settings.branding");
  const [logoUrl, setLogoUrl] = useState<string | null>(merchant.logo_url);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) {
        setLogoUrl(json.url);
      } else {
        toast.error(json.error?.message ?? t("saveFailed"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setUploading(false);
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
        body: JSON.stringify({ logo_url: logoUrl }),
      });
      if (res.ok) {
        toast.success(t("saved"));
        // Without this, every other already-visited dashboard route (topbar,
        // notification previews, dashboard home) keeps showing the old logo
        // from Next's client Router Cache (next.config.mjs's 30s staleTimes)
        // until the visitor happens to leave and return past that window —
        // effectively indefinitely if they never do. Every other settings
        // form that mutates server-rendered data already does this.
        router.refresh();
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
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
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
      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
