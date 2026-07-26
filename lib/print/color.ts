const DEFAULT_HEX = "#1f57e7";

/**
 * Coerces to a valid #rrggbb hex, falling back to a safe default for bad
 * input (empty string, missing "#", 3-digit shorthand, etc). Bad input left
 * unnormalized used to propagate straight into inline CSS — e.g.
 * `linear-gradient(155deg, , )` — which browsers silently drop, making a
 * template's entire background disappear. Every color a print template
 * touches should be passed through this first (see print-studio.tsx).
 */
export function normalizeHex(hex: string | undefined | null): string {
  const clean = (hex ?? "").trim().replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  return /^[0-9a-f]{6}$/i.test(full) ? `#${full.toLowerCase()}` : DEFAULT_HEX;
}

/** Lighten (positive) or darken (negative) a hex color by a percentage, for subtle print-asset gradients. */
export function shade(hex: string, percent: number): string {
  const num = parseInt(normalizeHex(hex).slice(1), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const amt = Math.round(2.55 * percent);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Relative luminance-based pick between black/white text for contrast against a hex background. */
export function readableTextColor(hex: string): "#111111" | "#ffffff" {
  const num = parseInt(normalizeHex(hex).slice(1), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#111111" : "#ffffff";
}
