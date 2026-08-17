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

/**
 * Solves cell size from the actual available box instead of a fixed lg/md/sm/xs
 * table — the table above was tuned for Google's tall canvas and overflows (or
 * looks tiny) on Apple's much shorter, wider strip. Originally lived only inside
 * renderAppleStripImage (lib/wallet/heroImage.ts); pulled out here so the
 * dashboard's live phone-mockup preview can use the exact same formula instead
 * of its own approximation — the two had drifted apart before (preview showed a
 * taller, roomier grid than the real strip actually has room for).
 */
export function solveStampGridCell(params: {
  stampsRequired: number;
  width: number;
  height: number;
  padding: number;
  gapRatio?: number;
  minCell?: number;
}): { columns: number; rows: number; cell: number; gap: number } {
  const { width, height, padding, gapRatio = 0.22, minCell = 8 } = params;
  const required = Math.max(1, params.stampsRequired);
  const columns = getStampGridColumns(required);
  const rows = Math.ceil(required / columns);

  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const cellFromWidth = availableWidth / (columns + (columns - 1) * gapRatio);
  const cellFromHeight = availableHeight / (rows + (rows - 1) * gapRatio);
  const cell = Math.max(minCell, Math.floor(Math.min(cellFromWidth, cellFromHeight)));
  const gap = Math.round(cell * gapRatio);

  return { columns, rows, cell, gap };
}
