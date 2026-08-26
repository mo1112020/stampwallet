import { ImageResponse } from "next/og";
import { loadCairoFont } from "@/lib/og/cairo-font";
import { isRtl } from "@/i18n/config";

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#241a12";
const SURFACE = "#f3e9d8";
const BACKGROUND = "#ead9bd";
const PRIMARY = "#b23a1a";
const MUTED = "#7d6b52";

/**
 * Shared renderer behind every blog opengraph-image.tsx route (index +
 * individual posts) — same "Stamp & Verdict" brand tokens as app/globals.css
 * .ws-stamp, hand-mirrored here since Satori (next/og's renderer) can't read
 * an actual stylesheet or CSS custom properties, only inline style objects.
 */
export async function renderBlogCard({
  eyebrow,
  title,
  locale,
}: {
  eyebrow: string;
  title: string;
  locale: string;
}) {
  const rtl = isRtl(locale);
  const align = rtl ? "flex-end" : "flex-start";
  const textAlign = rtl ? "right" : "left";
  // Rendered as-is below (no CSS textTransform) — Satori subsets the font to
  // exactly the characters passed to it, so if the eyebrow were rendered
  // uppercase via textTransform while the *lowercase* string got subsetted,
  // glyphs Satori never fetched (e.g. capital "G" from a subset that only
  // ever asked for "Blog") silently fall back to its own default typeface
  // for just that letter — confirmed by rendering it, not just reasoning
  // about it.
  const eyebrowUpper = eyebrow.toUpperCase();

  // Subset the font to exactly what's rendered on this card (eyebrow + title
  // + the wordmark), across both scripts — Arabic titles carry no Latin
  // glyphs and vice versa, so this stays small either way.
  const fontData = await loadCairoFont(`${eyebrowUpper}${title}WalletOS`, 900);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BACKGROUND,
          fontFamily: "Cairo",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            margin: "28px",
            padding: "64px",
            background: SURFACE,
            border: `3px solid ${INK}`,
            alignItems: align,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", direction: rtl ? "rtl" : "ltr" }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: INK }}>Wallet</span>
            <span style={{ fontSize: 34, fontWeight: 900, color: PRIMARY }}>OS</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: align, direction: rtl ? "rtl" : "ltr" }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: PRIMARY,
                letterSpacing: 3,
                textAlign,
              }}
            >
              {eyebrowUpper}
            </span>
            <span
              style={{
                marginTop: 16,
                fontSize: 56,
                fontWeight: 900,
                color: INK,
                lineHeight: 1.25,
                textAlign,
              }}
            >
              {title}
            </span>
          </div>

          <span style={{ fontSize: 20, fontWeight: 400, color: MUTED, direction: "ltr" }}>walletos.online</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Cairo", data: fontData, style: "normal", weight: 900 }],
    }
  );
}
