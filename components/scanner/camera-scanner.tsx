"use client";

import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

/**
 * Live QR camera scanner. Decodes continuously while mounted and not
 * paused; the parent is expected to pause it (rather than unmount) while
 * showing a confirm/result screen so re-mounting doesn't re-request camera
 * permission every time.
 */
export function CameraScanner({
  onScan,
  paused = false,
}: {
  onScan: (value: string) => void;
  paused?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paused) return;

    let cancelled = false;
    setError(null);

    Promise.all([import("@zxing/browser"), import("@zxing/library")]).then(([{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }]) => {
      if (cancelled) return;
      // Merchants can choose a barcode style per program (standard QR,
      // rounded/dot QR — which decodes identically to standard QR, or a
      // linear Code 128 barcode) — the scanner must read whichever style a
      // pass was issued with, without any merchant-side configuration. A
      // single reader hinted for both formats handles that automatically.
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128]);
      const reader = new BrowserMultiFormatReader(hints);

      reader
        .decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current ?? undefined,
          (result) => {
            if (cancelled || !result) return;
            onScanRef.current(result.getText());
          }
        )
        .then((controls) => {
          if (cancelled) {
            controls.stop();
          } else {
            controlsRef.current = controls;
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Could not access the camera. Check permissions and try again."
            );
          }
        });
    });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [paused]);

  if (error) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted)]">
        {error}
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70" />
    </div>
  );
}
