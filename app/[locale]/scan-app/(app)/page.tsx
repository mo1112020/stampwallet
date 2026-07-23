"use client";

import { useTranslations } from "next-intl";
import { ScanFlow } from "@/components/scanner/scan-flow";

export default function ScanAppPage() {
  const t = useTranslations("scanner");

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-white/60">{t("subtitle")}</p>
      <div className="mt-6">
        <ScanFlow dark />
      </div>
    </div>
  );
}
