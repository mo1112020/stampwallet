"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Share, SquarePlus, CheckCircle2, X, Download, Copy, Check } from "lucide-react";
import { isIOS, isIOSSafari, isMobile, isStandalone } from "@/lib/scanner/platform";

const STORAGE_KEY = "walletos-scanner-install-prompt";
// "Maybe later" reappears after a few days rather than every single visit —
// long enough to not nag, short enough that a merchant who just got
// distracted the first time still gets asked again on a later shift.
const LATER_MS = 3 * 24 * 60 * 60 * 1000;

type Dismissal = { status: "never" } | { status: "later"; until: number };

function readDismissal(): Dismissal | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Dismissal;
  } catch {
    return null;
  }
}

function writeDismissal(value: Dismissal) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private browsing / storage disabled — the prompt just reappears next
    // visit, which is an acceptable degradation, not a broken feature.
  }
}

function isDismissed(): boolean {
  const d = readDismissal();
  if (!d) return false;
  if (d.status === "never") return true;
  return Date.now() < d.until;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Variant = "android-native" | "android-fallback" | "ios-safari" | "ios-other";

/**
 * Install prompt for the standalone Scanner PWA — mounted once in
 * scan-app/(app)/layout.tsx so it only ever appears to an authenticated
 * merchant/staff member on the actual scanner page, never publicly.
 * Skips itself entirely when already running standalone, on desktop, or
 * when the merchant has already answered (Install/Maybe later/Never).
 */
export function InstallPrompt() {
  const t = useTranslations("scanner.install");
  const [variant, setVariant] = useState<Variant | null>(null);
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isMobile() || isDismissed()) return;

    let cancelled = false;
    let resolved = false;

    function reveal(v: Variant) {
      if (cancelled || resolved) return;
      resolved = true;
      setVariant(v);
    }

    if (isIOS()) {
      // No install-capability event exists on iOS at all — the guide (or
      // the "wrong browser" screen) IS the install flow, so there's nothing
      // to wait for.
      reveal(isIOSSafari() ? "ios-safari" : "ios-other");
      return;
    }

    // Android/other Chromium-based mobile browsers: `beforeinstallprompt`
    // can fire any time after load, so the listener is registered
    // immediately; a bounded wait falls back to generic text instructions
    // for browsers that never fire it (e.g. Firefox for Android) rather
    // than showing nothing.
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
      reveal("android-native");
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    const fallbackTimer = window.setTimeout(() => reveal("android-fallback"), 1500);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (!variant) return null;

  function dismiss(status: Dismissal["status"]) {
    if (status === "never") {
      writeDismissal({ status: "never" });
    } else {
      writeDismissal({ status: "later", until: Date.now() + LATER_MS });
    }
    setVariant(null);
  }

  async function install() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    // Either answer to the browser's own native dialog is a real answer —
    // no reason to ask again regardless of which way they went.
    writeDismissal({ status: "never" });
    setVariant(null);
    if (outcome === "accepted") return;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the link is still visible in the UI
      // below for a manual copy.
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#141414] p-6 text-white shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Download className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={() => dismiss("later")}
            aria-label={t("maybeLater")}
            className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 text-lg font-semibold">
          {variant === "ios-other" ? t("wrongBrowserTitle") : variant === "ios-safari" ? t("iosTitle") : t("title")}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-white/60">
          {variant === "ios-other" ? t("wrongBrowserBody") : t("body")}
        </p>

        {variant === "ios-safari" && (
          <ol className="mt-5 space-y-3">
            {[
              { icon: Share, label: t("iosStep1") },
              { icon: SquarePlus, label: t("iosStep2") },
              { icon: CheckCircle2, label: t("iosStep3") },
            ].map(({ icon: Icon, label }, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  {i + 1}
                </span>
                <Icon className="h-5 w-5 shrink-0 text-white/70" />
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </ol>
        )}

        {variant === "android-fallback" && (
          <p className="mt-4 rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white/70">{t("androidFallback")}</p>
        )}

        {variant === "ios-other" && (
          <button
            type="button"
            onClick={copyLink}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/15"
          >
            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {linkCopied ? t("linkCopied") : t("copyLink")}
          </button>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {variant === "android-native" && (
            <button
              type="button"
              onClick={install}
              className="h-11 w-full rounded-full bg-white text-sm font-semibold text-black hover:opacity-90"
            >
              {t("install")}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss("later")}
            className="h-11 w-full rounded-full border border-white/15 text-sm font-semibold text-white/80 hover:bg-white/5"
          >
            {t("maybeLater")}
          </button>
          <button
            type="button"
            onClick={() => dismiss("never")}
            className="text-center text-xs font-medium text-white/40 hover:text-white/60"
          >
            {t("neverAskAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}
