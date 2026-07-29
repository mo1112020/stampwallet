"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import type { BarcodeStyle } from "@/types";

async function renderQrSvg(value: string, size: number, dark: string): Promise<string> {
  return QRCode.toString(value, {
    type: "svg",
    width: size,
    margin: 1,
    color: { dark, light: "#00000000" },
  });
}

function renderCode128Svg(value: string, size: number, dark: string): { svg: string; height: number } {
  // JsBarcode draws into a real element rather than returning a string, so
  // a detached <svg> is used purely as a render target and then serialized
  // — this keeps the output as vector markup (see the comment below on why
  // that matters for the print export pipeline), not a raster canvas/img.
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svgEl, value, {
    format: "CODE128",
    lineColor: dark,
    background: "transparent",
    width: 2,
    height: size * 0.4,
    displayValue: false,
    // A linear barcode still needs *some* quiet zone (blank space) on each
    // side to scan reliably — margin: 0 (an earlier version of this) removed
    // it entirely, which also visually looked like the bars were touching
    // the edges with no breathing room. Kept tight rather than the 10px
    // used before, which — combined with forcing an arbitrary fixed aspect
    // ratio below — was the actual cause of the excess white space around
    // the bars.
    margin: 4,
  });
  // JsBarcode sizes the svg to its own natural aspect ratio — forcing an
  // arbitrary fixed height (e.g. a flat size * 0.6 guess) here regardless of
  // that ratio is what left large blank bands above/below the bars when the
  // barcode's real proportions didn't match the guess. Scaling by the real
  // natural width instead keeps the bars filling their box with no
  // letterboxing.
  const naturalWidth = parseFloat(svgEl.getAttribute("width") || String(size));
  const naturalHeight = parseFloat(svgEl.getAttribute("height") || String(size * 0.5));
  const displayHeight = (naturalHeight / naturalWidth) * size;
  svgEl.setAttribute("width", String(size));
  svgEl.setAttribute("height", String(displayHeight));
  svgEl.setAttribute("preserveAspectRatio", "none");
  return { svg: new XMLSerializer().serializeToString(svgEl), height: displayHeight };
}

/** Renders whichever barcode style the program is configured with (standard
 * QR or a linear Code128 barcode) as inline SVG — every caller (print
 * templates, dashboard mockup preview) shares this so a style change is
 * reflected everywhere at once instead of needing per-surface updates.
 * Google/Apple Wallet render their own barcode graphic from the
 * `type`/`format` field directly (lib/wallet/barcode.ts maps the same
 * BarcodeStyle to their enums). */
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
      if (style === "code128") {
        const result = renderCode128Svg(value, size, dark);
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
