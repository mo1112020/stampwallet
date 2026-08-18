import { cn } from "@/lib/utils";

/**
 * Marketing-only wordmark for the "Stamp & Verdict" world — a text lockup
 * rather than the shared raster Logo (components/brand/logo.tsx), which
 * stays untouched for the dashboard and scan-app. Set slightly crooked with
 * a faint offset "double-strike," the way a real rubber stamp reads when it
 * doesn't land perfectly square.
 */
export function LogoStamp({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex -rotate-1 items-center font-[var(--font-display)] text-xl font-[900] tracking-tight text-[var(--ink)]",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 translate-x-[1.5px] translate-y-[1px] text-[var(--primary)] opacity-40"
      >
        WalletOS
      </span>
      <span className="relative">
        Wallet<span className="text-[var(--primary)]">OS</span>
      </span>
    </span>
  );
}
