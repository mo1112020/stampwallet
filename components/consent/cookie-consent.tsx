"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "walletos-cookie-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function applyConsent(granted: boolean) {
  window.gtag?.("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}

export function CookieConsent() {
  const t = useTranslations("site.cookieConsent");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      // Re-apply on every load -- GA's default (see app/layout.tsx) starts
      // denied on each fresh page load regardless of a past choice, since
      // that default script has no way to read localStorage itself.
      applyConsent(stored === "granted");
      return;
    }
    setVisible(true);
  }, []);

  function choose(granted: boolean) {
    window.localStorage.setItem(STORAGE_KEY, granted ? "granted" : "denied");
    applyConsent(granted);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("title")}
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-[var(--line-strong)] bg-[var(--surface)] px-6 py-5"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted)]">
          {t("body")}{" "}
          <Link href={`/${locale}/privacy`} className="font-medium text-[var(--primary)] hover:underline">
            {t("privacyLink")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <Button variant="outline" size="sm" onClick={() => choose(false)}>
            {t("decline")}
          </Button>
          <Button size="sm" onClick={() => choose(true)}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
