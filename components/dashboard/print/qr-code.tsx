"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCodeImage({
  value,
  size = 240,
  dark = "#000000",
  className,
}: {
  value: string;
  size?: number;
  dark?: string;
  className?: string;
}) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: "svg",
      width: size,
      margin: 1,
      color: { dark, light: "#00000000" },
    }).then((markup) => {
      if (!cancelled) setSvg(markup);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size, dark]);

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
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
