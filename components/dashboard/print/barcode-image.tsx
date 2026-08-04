"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { BarcodeStyle } from "@/types";

async function renderQrSvg(value: string, size: number, dark: string): Promise<string> {
  return QRCode.toString(value, {
    type: "svg",
    width: size,
    margin: 1,
    color: { dark, light: "#00000000" },
  });
}

/** bwip-js is only ever needed for this one branch (print/branding/flyers
 * always render QR — see print-studio.tsx and program-card.tsx, which never
 * set barcodeStyle) — dynamically imported so its bundle (it links every
 * symbology it supports) only ever loads for a merchant who actually
 * previews a PDF417-configured card, the same lazy-load pattern
 * components/scanner/camera-scanner.tsx already uses for @zxing. */
async function renderPdf417Svg(value: string, size: number, dark: string): Promise<{ svg: string; height: number }> {
  // The bare "bwip-js" specifier's package.json nests its export map under
  // platform conditions (browser/electron/react-native/node) that TypeScript's
  // "bundler" resolution doesn't match without extra tsconfig config — the
  // explicit "/browser" subpath exports flat import/require/types entries
  // that resolve correctly with no config changes needed.
  const bwipjs = (await import("bwip-js/browser")).default;
  const svg = bwipjs.toSVG({
    bcid: "pdf417",
    text: value,
    scale: 3,
    includetext: false,
    barcolor: dark.replace("#", ""),
    // No quiet-zone padding of our own here — bwip-js already reserves
    // PDF417's required quiet zone inside the generated viewBox.
  });
  const match = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const naturalWidth = match ? parseFloat(match[1]) : size;
  const naturalHeight = match ? parseFloat(match[2]) : size * 0.4;
  const displayHeight = (naturalHeight / naturalWidth) * size;
  return { svg, height: displayHeight };
}

/** Renders whichever barcode style the program is configured with (standard
 * QR or a stacked PDF417 barcode) as inline SVG — every caller shares this
 * so a style change is reflected everywhere at once instead of needing
 * per-surface updates. Print/branding/flyer callers (print-studio.tsx,
 * program-card.tsx) never set `style`, so they always render QR regardless
 * of the program's wallet barcode setting. Google/Apple Wallet render their
 * own barcode graphic from the `type`/`format` field directly
 * (lib/wallet/barcode.ts maps the same BarcodeStyle to their enums); the
 * merchant scan-app's camera reader decodes both formats natively
 * (components/scanner/camera-scanner.tsx). */
export function BarcodeImage({
  value,
  style = "qr",
  size = 240,
  dark = "#000000",
  className,
}: {
  value: string;
  style?: BarcodeStyle;
  size?: number;
  dark?: string;
  className?: string;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const [height, setHeight] = useState(size);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (style === "pdf417") {
        const result = await renderPdf417Svg(value, size, dark);
        if (!cancelled) {
          setSvg(result.svg);
          setHeight(result.height);
        }
        return;
      }
      const markup = await renderQrSvg(value, size, dark);
      if (!cancelled) {
        setSvg(markup);
        setHeight(size);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, size, dark, style]);

  if (!svg) {
    return <div className={className} style={{ width: size, height: size }} aria-hidden="true" />;
  }

  return (
    // Rendered as inline SVG (vector paths), not a raster <img> — the
    // export pipeline (lib/print/export.ts, via html-to-image) snapshots
    // this DOM by serializing it into an SVG <foreignObject> and rasterizing
    // that on a <canvas>. iOS Safari unreliably rasterizes raster <img>
    // elements nested inside that foreignObject (they'd render fine on
    // screen but come out blank in the exported PNG/PDF); native SVG
    // content doesn't hit that path since it's already vector markup.
    <div
      className={className}
      style={{ width: size, height }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
