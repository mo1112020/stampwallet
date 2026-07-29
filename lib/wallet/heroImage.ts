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
    const res = await fetch(url);
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

/** Cover-fit background layer shared by both the plain cover photo and the
 * stamp-progress composite — darkened the same way the WalletOS live
 * preview darkens it (rgba(0,0,0,0.28)), so brand colors/contrast match. */
async function backgroundLayerSvg(backgroundImageUrl: string | undefined, primaryColor: string): Promise<string> {
  if (backgroundImageUrl) {
    const dataUri = await fetchAsPngDataUri(backgroundImageUrl);
    if (dataUri) {
      return `
        <image href="${dataUri}" x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" preserveAspectRatio="xMidYMid slice" />
        <rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="#000000" opacity="0.28" />
      `;
    }
  }
  return `<rect width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" fill="${primaryColor}" />`;
}

/** Plain cover-photo heroImage (points/steps programs, and stamp programs'
 * class-level fallback before any object-level progress image exists). */
export async function renderCoverHeroImage(backgroundImageUrl: string | undefined, primaryColor: string): Promise<Buffer> {
  const bg = await backgroundLayerSvg(backgroundImageUrl, primaryColor);
  const svg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">${bg}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Google Wallet has no native stamp-grid field — this renders the same
 * progress grid as the dashboard's WalletPreview (same column/scale rules
 * from lib/stamp-grid.ts, same Lucide icon, same filled/unfilled treatment)
 * as a single flattened image so it can occupy the object's heroImage slot. */
export async function renderStampProgressHeroImage(params: {
  config: StampConfig;
  collected: number;
  primaryColor: string;
  secondaryColor: string;
  backgroundImageUrl?: string;
}): Promise<Buffer> {
  const { config, collected, primaryColor, secondaryColor, backgroundImageUrl } = params;
  const required = Math.max(1, config.stamps_required);
  const columns = getStampGridColumns(required);
  const rows = Math.ceil(required / columns);
  const scale = getStampCellScale(required);
  const cell = CELL_PX[scale];
  const gap = GAP_PX[scale];

  const gridWidth = columns * cell + (columns - 1) * gap;
  const gridHeight = rows * cell + (rows - 1) * gap;
  const startX = (CANVAS_WIDTH - gridWidth) / 2;
  // Google's brand guidelines call for ~20dp breathing room top/bottom so
  // content doesn't touch the card edges — 48px gives that room at this
  // canvas size and still centers the grid when it's short.
  const padding = 48;
  const startY = Math.max(padding, (CANVAS_HEIGHT - gridHeight) / 2);

  const bg = await backgroundLayerSvg(backgroundImageUrl, primaryColor);

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

  const svg = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">${bg}${cells.join("")}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
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
