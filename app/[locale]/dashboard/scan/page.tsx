"use client";

import { useTranslations } from "next-intl";
import { ScanFlow } from "@/components/scanner/scan-flow";

export default function ScanPage() {
  const t = useTranslations("scanner");

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("subtitle")}</p>
      <div className="mt-8">
        <ScanFlow />
      </div>
    </div>
  );
}
