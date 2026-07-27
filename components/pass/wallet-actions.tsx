"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { WalletPlatform } from "@/lib/wallet/platform";

type Labels = {
  apple: string;
  google: string;
  adding: string;
  error: string;
};

type Props = {
  passId: string;
  appleAuthToken: string | null;
  googleAuthToken: string | null;
  platform: WalletPlatform;
  labels: Labels;
};

function AppleButton({ href, label, primary }: { href: string; label: string; primary: boolean }) {
  return (
    <a
      href={href}
      className={
        primary
          ? "flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
          : "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[15px] font-semibold text-[var(--ink)] transition-transform active:scale-[0.98]"
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/Apple_Wallet_icon.svg" alt="" className="h-5 w-auto" />
      {label}
    </a>
  );
}

function GoogleButton({
  onClick,
  loading,
  label,
  loadingLabel,
  primary,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  loadingLabel: string;
  primary: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={
        (primary
          ? "flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-black text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
          : "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[15px] font-semibold text-[var(--ink)] transition-transform active:scale-[0.98]") +
        " disabled:opacity-70"
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/images/Google_Wallet_icon.svg" alt="" className="h-5 w-auto" />
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}

/**
 * Apple's button is a plain anchor — the API route streams the .pkpass file
 * directly (Content-Disposition), so iOS's native "Add to Wallet" sheet
 * appears with zero client JS involved. Google has no static download URL:
 * minting a save link calls Google's Wallet API (upsert loyaltyClass +
 * loyaltyObject), which is real, non-cacheable network latency — worth
 * paying only when the visitor actually asks to add it, not on every page
 * load. That's why it's a button with an explicit loading state rather than
 * a link, and why we don't prefetch it server-side for every visitor.
 */
export function WalletActions({ passId, appleAuthToken, googleAuthToken, platform, labels }: Props) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appleHref = appleAuthToken ? `/api/wallet/apple/${passId}?token=${appleAuthToken}` : null;

  async function handleGoogle() {
    if (!googleAuthToken || googleLoading) return;
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet/google/${passId}?token=${googleAuthToken}`);
      const json = await res.json();
      if (!res.ok || !json?.data?.saveUrl) throw new Error(json?.error?.message ?? labels.error);
      window.location.href = json.data.saveUrl;
    } catch {
      setError(labels.error);
      setGoogleLoading(false);
    }
  }

  if (!appleHref && !googleAuthToken) return null;

  const applePrimary = platform !== "android";
  const apple = appleHref && (
    <AppleButton key="apple" href={appleHref} label={labels.apple} primary={applePrimary} />
  );
  const google = googleAuthToken && (
    <GoogleButton
      key="google"
      onClick={handleGoogle}
      loading={googleLoading}
      label={labels.google}
      loadingLabel={labels.adding}
      primary={!applePrimary}
    />
  );

  // Lead with whichever wallet matches the visitor's device; still offer the
  // other one underneath rather than hiding it outright (desktop/unrecognized
  // devices, or someone who just prefers the other wallet).
  const ordered = platform === "android" ? [google, apple] : [apple, google];

  return (
    <div className="space-y-2.5">
      {ordered}
      {error && <p className="text-center text-[13px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
