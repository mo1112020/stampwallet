"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Merchant } from "@/types";

export default function DataSettingsPage() {
  const t = useTranslations("settings.data");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/merchants/me")
      .then((r) => r.json())
      .then((json) => setMerchant(json.data));
  }, []);

  async function deleteAccount() {
    if (!merchant) return;
    setDeleting(true);
    setError(null);
    const res = await fetch("/api/settings/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm_business_name: confirmText }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error?.message ?? t("deleteFailed"));
      setDeleting(false);
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  }

  return (
    <div className="max-w-md space-y-10">
      <div>
        <p className="text-sm font-semibold text-[var(--ink)]">{t("exportTitle")}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("exportDescription")}</p>
        <a
          href="/api/settings/export"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
        >
          {t("exportButton")}
        </a>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-semibold text-red-900">{t("deleteTitle")}</p>
        <p className="mt-1 text-sm text-red-800">{t("deleteDescription")}</p>

        {!showConfirm ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4 border-red-300 text-red-800 hover:bg-red-100"
            onClick={() => setShowConfirm(true)}
          >
            {t("deleteButton")}
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <Label htmlFor="confirm">{t("confirmLabel", { name: merchant?.business_name ?? "" })}</Label>
            <Input id="confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={deleting || confirmText !== merchant?.business_name}
                className="bg-red-700 hover:bg-red-800"
                onClick={deleteAccount}
              >
                {deleting ? t("deleting") : t("confirmDelete")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowConfirm(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
