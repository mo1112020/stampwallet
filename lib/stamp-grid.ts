/**
 * Shared sizing for every place a stamp grid is rendered (wallet-preview,
 * phone-mockup, progress-visual). stamps_required ranges 1-25 (see
 * stampConfigSchema) — as it grows, more columns keep the grid to a bounded
 * number of rows, and the matching cell scale shrinks icon/text so nothing
 * overflows its circle or the card.
 */
export function getStampGridColumns(stampsRequired: number): number {
  const n = Math.max(1, Math.min(25, stampsRequired));
  if (n <= 15) return 5;
  if (n <= 20) return Math.ceil(n / 3);
  return 7;
}

export type StampCellScale = "lg" | "md" | "sm" | "xs";

/** Tiers align with getStampGridColumns — more columns means smaller cells. */
export function getStampCellScale(stampsRequired: number): StampCellScale {
  const n = Math.max(1, Math.min(25, stampsRequired));
  if (n <= 10) return "lg";
  if (n <= 15) return "md";
  if (n <= 20) return "sm";
  return "xs";
}
