import { Bell, ScanLine, ShieldCheck, Smartphone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustCapability = { icon: LucideIcon; label: string };

export const TRUST_CAPABILITY_ICONS = [Smartphone, Bell, ScanLine, ShieldCheck] as const;

/** Compact row of platform-compatibility + capability signals. Apple/Google
 * marks are the actual icon assets already in public/images (not
 * recreated) — see components/marketing/wallet-preview-card.tsx for the
 * same convention. Labels are passed in (translated) rather than hardcoded
 * so this reads correctly on the Arabic site too. */
export function TrustBadges({
  appleLabel,
  googleLabel,
  capabilities,
  className,
}: {
  appleLabel: string;
  googleLabel: string;
  capabilities: TrustCapability[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-6 gap-y-3", className)}>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/Apple_Wallet_icon.svg"
          alt=""
          aria-hidden="true"
          width={21}
          height={16}
          className="h-4 w-auto"
        />
        {appleLabel}
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/Google_Wallet_icon.svg"
          alt=""
          aria-hidden="true"
          width={19}
          height={16}
          className="h-4 w-auto"
        />
        {googleLabel}
      </span>
      {capabilities.map(({ icon: Icon, label }) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)]">
          <Icon className="h-4 w-4 text-[var(--primary)]" strokeWidth={1.75} />
          {label}
        </span>
      ))}
    </div>
  );
}
