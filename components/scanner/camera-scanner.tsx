"use client";

import { useEffect, useRef, useState } from "react";
import { Settings, Zap, ZapOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { IScannerControls } from "@zxing/browser";
import { isIOS } from "@/lib/scanner/platform";

/** Fires a short vibration + synthesized beep on a successful decode — the
 * merchant is watching the customer's phone, not this screen, so an audible/
 * haptic cue is the only feedback they'll actually notice mid-scan. Both are
 * best-effort: navigator.vibrate is unsupported on iOS Safari entirely, and
 * an AudioContext can be blocked until a user gesture unlocks it on some
 * mobile browsers — neither failure should ever break scanning itself. */
function playScanFeedback() {
  try {
    navigator.vibrate?.(120);
  } catch {
    // Unsupported — silent no-op.
  }
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator.onended = () => ctx.close();
  } catch {
    // Blocked/unsupported — silent no-op.
  }
}

// How long the green "matched" frame shows before handing off to the
// parent's onScan — long enough to register as a deliberate confirmation,
// short enough not to feel like it's stalling the scan.
const MATCH_FLASH_MS = 220;

/**
 * Live QR/PDF417 camera scanner. Decodes continuously while mounted and not
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
  const t = useTranslations("scanner");
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  // Guards against the same code firing onScan more than once: zxing's
  // decode loop keeps running (and can decode the still-visible code again
  // on the next video frame) for the brief window between a successful
  // result and the parent actually pausing/unmounting this component in
  // response — without this, a single presented code could trigger two
  // scan-and-award requests instead of one.
  const hasScannedRef = useRef(false);
  // Permission-denied gets its own state: a raw browser error string ("could
  // not access the camera") leaves the person with no next step, and this is
  // the single most common reason the scanner doesn't work for a
  // just-installed staff account — it deserves real platform-specific
  // instructions rather than generic error text.
  const [error, setError] = useState<{ kind: "permission" | "other"; message?: string } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  // Briefly shows a "matched" state (green frame) before handing off to the
  // parent — the parent swaps this component out for a loading screen the
  // moment onScan fires, so without this delay a successful scan gave no
  // visible confirmation at all beyond the vibration/beep.
  const [matched, setMatched] = useState(false);

  useEffect(() => {
    if (paused) return;

    let cancelled = false;
    hasScannedRef.current = false;
    setError(null);
    setTorchOn(false);
    setTorchSupported(false);
    setMatched(false);

    Promise.all([import("@zxing/browser"), import("@zxing/library")]).then(([{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }]) => {
      if (cancelled) return;
      // Merchants can choose a barcode style per program (standard QR, or a
      // stacked PDF417 barcode) — the scanner must read whichever style a
      // pass was issued with, without any merchant-side configuration. A
      // single reader hinted for both formats handles that automatically.
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE, BarcodeFormat.PDF_417]);
      const reader = new BrowserMultiFormatReader(hints);

      reader
        .decodeFromConstraints(
          {
            video: {
              facingMode: "environment",
              // Non-standard but widely supported on Android Chrome; safely
              // ignored by browsers/cameras that don't recognize it rather
              // than rejecting the whole constraint set (it's inside
              // `advanced`, which getUserMedia treats as best-effort).
              advanced: [{ focusMode: "continuous" } as unknown as MediaTrackConstraintSet],
            } as MediaTrackConstraints,
          },
          videoRef.current ?? undefined,
          (result) => {
            if (cancelled || !result || hasScannedRef.current) return;
            hasScannedRef.current = true;
            playScanFeedback();
            setMatched(true);
            const text = result.getText();
            window.setTimeout(() => {
              if (!cancelled) onScanRef.current(text);
            }, MATCH_FLASH_MS);
          }
        )
        .then((controls) => {
          if (cancelled) {
            controls.stop();
            return;
          }
          controlsRef.current = controls;
          // Torch control lives on the underlying MediaStreamTrack, not on
          // zxing's IScannerControls — read it straight off the <video>'s
          // stream. Unsupported entirely on iOS Safari (Apple doesn't
          // expose torch control to web content), so this button simply
          // never appears there rather than showing a broken toggle.
          const stream = videoRef.current?.srcObject;
          if (stream instanceof MediaStream) {
            const track = stream.getVideoTracks()[0];
            const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
            if (track && capabilities?.torch) {
              setTorchSupported(true);
            }
          }
        })
        .catch((err) => {
          if (cancelled) return;
          // NotAllowedError covers both an explicit deny and a site the
          // browser silently blocked (e.g. previously denied) — either way
          // the fix is the same "go allow camera access" flow, so both are
          // treated as "permission" rather than trying to tell them apart.
          const isPermissionError =
            err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
          setError(
            isPermissionError
              ? { kind: "permission" }
              : {
                  kind: "other",
                  message:
                    err instanceof Error
                      ? err.message
                      : "Could not access the camera. Check permissions and try again.",
                }
          );
        });
    });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [paused]);

  function toggleTorch() {
    const stream = videoRef.current?.srcObject;
    if (!(stream instanceof MediaStream)) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    track
      .applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] })
      .then(() => setTorchOn(next))
      .catch(() => {
        // Capability check said torch was supported but the runtime
        // constraint application failed anyway (happens on some Android
        // devices) — leave the toggle state untouched rather than showing a
        // flash state that isn't actually active.
      });
  }

  if (error?.kind === "permission") {
    // Same fix regardless of staff role (owner/admin/manager/staff all hit
    // this identically) — camera permission is a per-browser/per-device
    // setting, not something tied to the account. Steps differ by platform
    // since iOS Safari and Android Chrome expose the toggle in different
    // places, but a full page reload is the one retry that reliably
    // re-triggers the permission prompt on every browser tested.
    const steps = isIOS()
      ? [t("cameraError.iosStep1"), t("cameraError.iosStep2"), t("cameraError.iosStep3")]
      : [t("cameraError.androidStep1"), t("cameraError.androidStep2"), t("cameraError.androidStep3")];
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)]">
          <Settings className="h-6 w-6 text-[var(--muted)]" />
        </div>
        <p className="mt-4 text-sm font-semibold">{t("cameraError.title")}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("cameraError.body")}</p>
        <ol className="mt-4 w-full space-y-2 text-start">
          {steps.map((label, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-bold">
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 h-11 w-full rounded-full bg-[var(--ink)] text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {t("cameraError.tryAgain")}
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted)]">
        {error.message}
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <div
        className={`pointer-events-none absolute inset-8 overflow-hidden rounded-2xl border-2 transition-colors duration-150 ${
          matched ? "border-[#22c55e]" : "border-white/70"
        }`}
      >
        {/* Sweeping scan line — the frame alone gave no sense that anything
            was actively happening while waiting for a code to line up. */}
        {!matched && (
          <div className="scan-line-sweep absolute inset-x-0 h-0.5 bg-[#22c55e]/90 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]" />
        )}
        {matched && <div className="absolute inset-0 bg-[#22c55e]/15" />}
      </div>
      {torchSupported && (
        <button
          type="button"
          onClick={toggleTorch}
          aria-label={torchOn ? t("flashOff") : t("flashOn")}
          className={`absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
            torchOn ? "bg-white text-black" : "bg-black/40 text-white"
          }`}
        >
          {torchOn ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}
