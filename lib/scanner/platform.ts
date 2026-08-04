/** Client-only PWA platform detection for the Scanner install prompt. Pure
 * functions reading navigator/window directly — callers must only invoke
 * these after mount (never during SSR, where none of these APIs exist). */

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's own pre-standard flag — matchMedia alone doesn't cover
    // it on older iOS versions.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS 13+ reports as "MacIntel" with touch support instead of
  // identifying itself as iPad in the UA string — maxTouchPoints catches
  // that case a plain UA-string test misses.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/.test(navigator.userAgent);
}

/** True only for actual Safari — every other iOS browser (Chrome, Firefox,
 * Edge, Brave, Opera) is WebKit-based and still contains "Safari" in its UA
 * string, but each adds its own distinguishing token. */
export function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    isIOS() &&
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|mercury|GSA/.test(ua)
  );
}

export function isMobile(): boolean {
  return isIOS() || isAndroid();
}
