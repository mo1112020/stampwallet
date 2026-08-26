const FONT_CACHE = new Map<string, Promise<ArrayBuffer>>();

/**
 * Fetches a Cairo TTF subset containing only the glyphs present in `text`,
 * for use with next/og's ImageResponse (Satori doesn't do system font
 * lookup — a font has to be supplied as raw bytes, and the default fallback
 * can't shape Arabic at all). Google Fonts only serves a raw TTF (not
 * WOFF2, which Satori can't parse) to an older-looking User-Agent — this is
 * the standard workaround, not a hack specific to this project. Verified
 * directly: Cairo/Satori correctly shapes and joins Arabic glyphs with this
 * exact approach (see the blog opengraph-image routes this backs).
 *
 * Caches per (text, weight) — since each call site passes a fixed title
 * known at request time, this avoids re-fetching the same subset twice
 * within a warm serverless instance.
 */
export async function loadCairoFont(text: string, weight: 400 | 700 | 900 = 900): Promise<ArrayBuffer> {
  const key = `${weight}:${text}`;
  let cached = FONT_CACHE.get(key);
  if (!cached) {
    cached = fetchCairoFont(text, weight);
    FONT_CACHE.set(key, cached);
  }
  return cached;
}

async function fetchCairoFont(text: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Cairo:wght@${weight}&text=${encodeURIComponent(text)}&display=swap`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.85 Safari/537.36",
      },
    }
  ).then((res) => res.text());

  const match = css.match(/url\(([^)]+)\)/);
  const url = match?.[1];
  if (!url) throw new Error("loadCairoFont: no font URL found in Google Fonts CSS response");

  const res = await fetch(url);
  return res.arrayBuffer();
}
