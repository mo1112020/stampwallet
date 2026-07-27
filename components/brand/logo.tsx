import { cn } from "@/lib/utils";

/**
 * Theme-aware WalletOS wordmark — swaps between the dark-text (light
 * surfaces) and white-text (dark surfaces) lockups via Tailwind's `dark:`
 * class variant, so it never needs client-side theme detection.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-horizontal-light.png" alt="WalletOS" className="h-full w-auto dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-horizontal-dark.png"
        alt="WalletOS"
        className="hidden h-full w-auto dark:block"
      />
    </span>
  );
}

/** Fixed white-text wordmark for surfaces that are always dark (e.g. the scan-app shell), regardless of the site's light/dark theme setting. */
export function LogoOnDark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo-horizontal-dark.png" alt="WalletOS" className={cn("h-full w-auto", className)} />
  );
}
