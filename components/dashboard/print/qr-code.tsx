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
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 3,
      margin: 1,
      color: { dark, light: "#00000000" },
    }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size, dark]);

  if (!src) {
    return <div className={className} style={{ width: size, height: size }} aria-hidden="true" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} className={className} />;
}
