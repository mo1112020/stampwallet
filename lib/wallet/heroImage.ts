import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStampGridColumns, getStampCellScale, type StampCellScale } from "@/lib/stamp-grid";
import { getIconNode } from "@/lib/wallet/stampIcons";
import type { StampConfig } from "@/types";

// Google's documented heroImage guidance (developers.google.com/wallet/generic/resources/brand-guidelines):
// "1032x812 px", "approximately 5:4" aspect ratio, rendered "as a full-width
// image under the data fields of your pass" — every heroImage we generate
// targets this canvas so Google's own scaling never crops it unpredictably.
const CANVAS_WIDTH = 1032;
const CANVAS_HEIGHT = 812;

const CELL_PX: Record<StampCellScale, number> = { lg: 130, md: 100, sm: 82, xs: 64 };
const GAP_PX: Record<StampCellScale, number> = { lg: 26, md: 20, sm: 16, xs: 12 };

/** Lucide icons ship as [tagName, attrs][] tuples (attrs always simple
 * string values plus a React-only `key`) — serializing them directly avoids
 * needing react-dom/server (see stampIcons.ts for why). viewBox is always
 * "0 0 24 24" for Lucide's default icon set. */
function iconGroupMarkup(iconName: string, color: string, x: number, y: number, size: number): string {
  const node = getIconNode(iconName);
  const shapes = node
    .map(([tag, attrs]) => {
      const attrString = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<${tag} ${attrString} />`;
    })
    .join("");
  return `<g transform="translate(${x},${y}) scale(${size / 24})" stroke="${color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`;
}

async function fetchAsPngDataUri(url: string): Promise<string | null> {
  try {
    // An unbounded fetch here is a real outage risk, not a theoretical one —
    // this function runs inside every stamp/points push (see google.ts), and
    // a single slow/unreachable image previously hung the whole request
    // indefinitely, wedging an entire notification campaign at "sending"
    // (sequential per-target loop in campaigns.ts) since the platform's
    // function timeout eventually kills the process before it can ever
    // record success or failure. Bounded here so a bad image can only ever
    // cost a few seconds, not the whole batch.
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const raw = Buffer.from(await res.arrayBuffer());
    // Never trust the server's declared content-type — a file saved with a
    // mismatched extension (e.g. WebP bytes served as "image/png") makes an
    // SVG renderer silently fail to decode an <image> embed. Sharp sniffs
    // the actual file signature and always re-encodes to real PNG bytes, so
    // whatever we embed is guaranteed valid regardless of what was claimed.
    const png = await sharp(raw).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Apple's icon.png (shown in notifications and the Wallet pass list — @1x
 * 29x29, @2x 58x58, @3x 87x87) and logo.png (top-left of the card itself,
 * fixed ~50pt height — @1x, @2x only, no @3x) were hardcoded to WalletOS's
 * own bundled artwork (lib/wallet/assets.ts) regardless of whether the
 * merchant had uploaded their own logo, so every pass and every
 * notification always showed the WalletOS mark instead of the merchant's
 * brand. Fetches the merchant's logo once and derives every size from that
 * one master — returns null (caller falls back to the bundled WalletOS
 * assets) if there's no logo configured or fetching/decoding it fails, so a
 * broken image URL degrades to the old default rather than failing pass
 * generation. */
export async function renderMerchantIconAndLogo(
  logoUrl: string | null | undefined
): Promise<{
  icon: { "1x": Buffer; "2x": Buffer; "3x": Buffer };
  logo: { "1x": Buffer; "2x": Buffer };
} | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const raw = Buffer.from(await res.arrayBuffer());
    // Sniffs the real file signature and re-encodes to PNG regardless of
    // what the source claimed — same reasoning as fetchAsPngDataUri above.
    const master = await sharp(raw).png().toBuffer();

    const [icon1x, icon2x, icon3x] = await Promise.all([
      sharp(master).resize(29, 29, { fit: "cover" }).png().toBuffer(),
      sharp(master).resize(58, 58, { fit: "cover" }).png().toBuffer(),
      sharp(master).resize(87, 87, { fit: "cover" }).png().toBuffer(),
    ]);
    // logo.png sits in a fixed-height, variable-width header slot — "contain"
    // (not "cover") so an arbitrary-aspect-ratio merchant logo is never
    // cropped, padded with transparency instead.
    const [logo1x, logo2x] = await Promise.all([
      sharp(master)
        .resize(160, 50, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
      sharp(master)
        .resize(320, 100, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
    ]);

    return {
      icon: { "1x": icon1x, "2x": icon2x, "3x": icon3x },
      logo: { "1x": logo1x, "2x": logo2x },
    };
  } catch (err) {
    console.error("[wallet:heroImage] merchant icon/logo render failed", logoUrl, err);
    return null;
  }
}

/** Cover-fit background layer shared by both the plain cover photo and the
 * stamp-progress composite — darkened the same way the WalletOS live
 * preview darkens it (rgba(0,0,0,0.28)), so brand colors/contrast match. */
async function backgroundLayerSvg(
  backgroundImageUrl: string | undefined,
  primaryColor: string,
  width: number = CANVAS_WIDTH,
  height: number = CANVAS_HEIGHT
): Promise<string> {
  if (backgroundImageUrl) {
    const dataUri = await fetchAsPngDataUri(backgroundImageUrl);
    if (dataUri) {
      return `
        <image href="${dataUri}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
        <rect width="${width}" height="${height}" fill="#000000" opacity="0.28" />
      `;
    }
  }
  return `<rect width="${width}" height="${height}" fill="${primaryColor}" />`;
}

/** Plain cover-photo heroImage (points/steps programs, and stamp programs'
 * class-level fallback before any object-level progress image exists). */
export async function renderCoverHeroImage(backgroundImageUrl: string | undefined, primaryColor: string): Promise<Buffer> {
  const bg = await backgroundLayerSvg(backgroundImageUrl, primaryColor);
  const svg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">${bg}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Matches the actual proportions in components/dashboard/phone-mockup.tsx's
// "Wallet card" live preview: a fixed-height cover image up top (with a dark
// gradient for legibility), and the stamp grid directly beneath it on the
// card's own primary-color background — not overlaid on the photo, and not
// two separately-delivered images. Google Wallet has no field for either a
// full-bleed background-with-overlaid-content layout (heroImage is always a
// banner "under the data fields", not behind them — a platform constraint,
// not a bug) or a native stamp grid — this composite is the closest
// single-image equivalent the heroImage slot can hold.
const COVER_HEIGHT_RATIO = 0.45;

/** Google Wallet has no native stamp-grid field, so for stamp-type programs
 * this single flattened image (cover photo on top, stamp grid directly
 * underneath — see COVER_HEIGHT_RATIO comment above) becomes the object's
 * heroImage. Grid layout uses the same column/scale rules and the same
 * Lucide icon as everywhere else (lib/stamp-grid.ts). */
export async function renderStampCardHeroImage(params: {
  config: StampConfig;
  collected: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundImageUrl?: string;
}): Promise<Buffer> {
  const { config, collected, primaryColor, secondaryColor, backgroundImageUrl } = params;
  const coverHeight = Math.round(CANVAS_HEIGHT * COVER_HEIGHT_RATIO);
  const gridAreaHeight = CANVAS_HEIGHT - coverHeight;

  let coverLayer = `<rect width="${CANVAS_WIDTH}" height="${coverHeight}" fill="${primaryColor}" />`;
  if (backgroundImageUrl) {
    const dataUri = await fetchAsPngDataUri(backgroundImageUrl);
    if (dataUri) {
      coverLayer = `
        <image href="${dataUri}" x="0" y="0" width="${CANVAS_WIDTH}" height="${coverHeight}" preserveAspectRatio="xMidYMid slice" />
        <rect width="${CANVAS_WIDTH}" height="${coverHeight}" fill="#000000" opacity="0.28" />
      `;
    }
  }
  // Fades the cover's bottom edge into the grid section's solid color —
  // the same image-to-card transition the phone-mockup preview uses,
  // avoiding a hard seam between the two sections of one flattened image.
  const seamFadeHeight = Math.round(coverHeight * 0.25);
  const seamFade = `
    <defs>
      <linearGradient id="seamFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0" />
        <stop offset="100%" stop-color="${primaryColor}" stop-opacity="1" />
      </linearGradient>
    </defs>
    <rect x="0" y="${coverHeight - seamFadeHeight}" width="${CANVAS_WIDTH}" height="${seamFadeHeight}" fill="url(#seamFade)" />
  `;

  const required = Math.max(1, config.stamps_required);
  const columns = getStampGridColumns(required);
  const rows = Math.ceil(required / columns);
  const scale = getStampCellScale(required);
  const cell = CELL_PX[scale];
  const gap = GAP_PX[scale];

  const gridWidth = columns * cell + (columns - 1) * gap;
  const gridHeight = rows * cell + (rows - 1) * gap;
  const startX = (CANVAS_WIDTH - gridWidth) / 2;
  // Google's brand guidelines call for ~20dp breathing room so content
  // doesn't touch the image edges — applied within the grid section only.
  const padding = 40;
  const availableHeight = gridAreaHeight - padding * 2;
  const startY = coverHeight + padding + Math.max(0, (availableHeight - gridHeight) / 2);

  const cells: string[] = [];
  for (let i = 0; i < required; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = startX + col * (cell + gap);
    const y = startY + row * (cell + gap);
    const filled = i < collected;
    const iconColor = filled ? "#ffffff" : secondaryColor;
    const iconSize = cell * 0.5;

    cells.push(`
      <g opacity="${filled ? 1 : 0.45}">
        <circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${cell / 2}"
          fill="${filled ? secondaryColor : "transparent"}"
          stroke="${secondaryColor}" stroke-width="3" />
        ${iconGroupMarkup(config.icon, iconColor, x + (cell - iconSize) / 2, y + (cell - iconSize) / 2, iconSize)}
      </g>
    `);
  }

  const svg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${primaryColor}" />
    ${coverLayer}
    ${seamFade}
    ${cells.join("")}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Apple's PassKit Package Format Reference gives 375x123pt (@1x) as the
// storeCard "strip" image size when no square/thumbnail image is present —
// unlike Google's heroImage this is embedded directly in the .pkpass (no
// public URL needed), and it's the ONLY region of an Apple Wallet pass that
// can hold custom graphics; the primary/secondary/auxiliary fields below it
// are always plain platform-rendered text, which is why the stamp grid has
// to live in this image rather than being a "field" of some kind.
const STRIP_WIDTH_1X = 375;
const STRIP_HEIGHT_1X = 123;
const STRIP_SCALE = 3; // generate at @3x, downsample for @2x/@1x

/** Apple equivalent of renderStampCardHeroImage — same brand cover photo +
 * circular stamp grid look as the dashboard live preview and Google Wallet's
 * heroImage, but composited as one overlay (photo/color behind, grid on top)
 * rather than stacked top/bottom: at 123pt tall there isn't room to devote a
 * separate band to the cover photo AND keep the stamp circles legible, so
 * the photo becomes a full-bleed darkened backdrop instead. Grid cell size
 * is solved for the available space rather than using renderStampCardHeroImage's
 * fixed lg/md/sm/xs table, since that table was tuned for Google's much
 * taller canvas and would overflow or look tiny at this aspect ratio. */
export async function renderAppleStripImage(params: {
  config: StampConfig;
  collected: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundImageUrl?: string;
}): Promise<{ "1x": Buffer; "2x": Buffer; "3x": Buffer }> {
  const { config, collected, primaryColor, secondaryColor, backgroundImageUrl } = params;
  const width = STRIP_WIDTH_1X * STRIP_SCALE;
  const height = STRIP_HEIGHT_1X * STRIP_SCALE;

  const bg = await backgroundLayerSvg(backgroundImageUrl, primaryColor, width, height);

  const required = Math.max(1, config.stamps_required);
  const columns = getStampGridColumns(required);
  const rows = Math.ceil(required / columns);

  const padding = 18 * STRIP_SCALE;
  const gapRatio = 0.22; // gap as a fraction of cell size
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const cellFromWidth = availableWidth / (columns + (columns - 1) * gapRatio);
  const cellFromHeight = availableHeight / (rows + (rows - 1) * gapRatio);
  const cell = Math.max(8, Math.floor(Math.min(cellFromWidth, cellFromHeight)));
  const gap = Math.round(cell * gapRatio);

  const gridWidth = columns * cell + (columns - 1) * gap;
  const gridHeight = rows * cell + (rows - 1) * gap;
  const startX = (width - gridWidth) / 2;
  const startY = (height - gridHeight) / 2;

  const cells: string[] = [];
  for (let i = 0; i < required; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = startX + col * (cell + gap);
    const y = startY + row * (cell + gap);
    const filled = i < collected;
    const iconColor = filled ? "#ffffff" : secondaryColor;
    const iconSize = cell * 0.5;

    cells.push(`
      <g opacity="${filled ? 1 : 0.55}">
        <circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${cell / 2}"
          fill="${filled ? secondaryColor : "rgba(255,255,255,0.12)"}"
          stroke="${filled ? secondaryColor : "rgba(255,255,255,0.6)"}" stroke-width="${Math.max(1, cell * 0.05)}" />
        ${iconGroupMarkup(config.icon, iconColor, x + (cell - iconSize) / 2, y + (cell - iconSize) / 2, iconSize)}
      </g>
    `);
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${bg}
    ${cells.join("")}
  </svg>`;

  const master = await sharp(Buffer.from(svg)).png().toBuffer();
  const [oneX, twoX, threeX] = await Promise.all([
    sharp(master).resize(STRIP_WIDTH_1X, STRIP_HEIGHT_1X).png().toBuffer(),
    sharp(master).resize(STRIP_WIDTH_1X * 2, STRIP_HEIGHT_1X * 2).png().toBuffer(),
    Promise.resolve(master),
  ]);

  return { "1x": oneX, "2x": twoX, "3x": threeX };
}

/** Plain-cover variant of renderAppleStripImage for points/steps programs
 * (no discrete per-unit icon to grid, same as renderCoverHeroImage's role
 * for Google Wallet). */
export async function renderAppleStripCover(
  backgroundImageUrl: string | undefined,
  primaryColor: string
): Promise<{ "1x": Buffer; "2x": Buffer; "3x": Buffer }> {
  const width = STRIP_WIDTH_1X * STRIP_SCALE;
  const height = STRIP_HEIGHT_1X * STRIP_SCALE;
  const bg = await backgroundLayerSvg(backgroundImageUrl, primaryColor, width, height);
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${bg}</svg>`;
  const master = await sharp(Buffer.from(svg)).png().toBuffer();
  const [oneX, twoX, threeX] = await Promise.all([
    sharp(master).resize(STRIP_WIDTH_1X, STRIP_HEIGHT_1X).png().toBuffer(),
    sharp(master).resize(STRIP_WIDTH_1X * 2, STRIP_HEIGHT_1X * 2).png().toBuffer(),
    Promise.resolve(master),
  ]);
  return { "1x": oneX, "2x": twoX, "3x": threeX };
}

/** Uploads to the same public `card-backgrounds` bucket merchants' own cover
 * photos already live in, at a stable per-key path (upsert — no unbounded
 * storage growth), with a `?v=` cache-busting suffix on the returned URL so
 * Google Wallet (and any CDN in front of Supabase Storage) always fetches
 * the new bytes instead of a cached copy of the old image at that path. */
export async function uploadHeroImage(key: string, buffer: Buffer): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const path = `hero/${key}.png`;
    const { error } = await admin.storage.from("card-backgrounds").upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) throw new Error(error.message);
    const { data } = admin.storage.from("card-backgrounds").getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch (err) {
    // No service role configured, or storage unreachable — callers fall
    // back to leaving heroImage unset/unchanged rather than failing the
    // whole pass update over a decorative image.
    console.error("[wallet:heroImage] upload failed", key, err);
    return null;
  }
}
