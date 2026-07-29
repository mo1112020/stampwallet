"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { printFont } from "@/lib/fonts/print";
import type { TemplateDimension } from "./dimensions";

export function PrintPreviewDialog({
  label,
  dim,
  open,
  onOpenChange,
  onDownload,
  exportingId,
  templateId,
  children,
}: {
  label: string;
  dim: TemplateDimension;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (format: "png" | "pdf") => void;
  exportingId: string | null;
  templateId: string;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Deliberately no fallback guess here (e.g. a fixed 0.25) — if the very
  // first measurement raced the dialog's own layout and undershot, nothing
  // afterward would ever correct it (a ResizeObserver only reports actual
  // size *changes*, and this container's box doesn't change again once the
  // dialog has finished laying out). Rendering nothing until the first real
  // measurement lands is safer than risking a permanently-wrong-but-valid
  // scale.
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    if (!open) {
      setScale(null);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const next = Math.min(rect.width / dim.widthPx, rect.height / dim.heightPx);
      if (next > 0) setScale(next);
    };
    compute();
    // The dialog's flex layout can still be settling on the exact frame this
    // effect first runs — a second pass next frame catches that without
    // waiting on a ResizeObserver entry that may never fire (this
    // container's own box doesn't necessarily change size again).
    const raf = requestAnimationFrame(compute);
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [open, dim.widthPx, dim.heightPx]);

  const pngKey = `${templateId}-png`;
  const pdfKey = `${templateId}-pdf`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        // Radix portals DialogContent straight to document.body, outside the
        // DOM subtree print-studio.tsx wraps in printFont.variable — CSS
        // custom properties cascade through real DOM ancestry, not React
        // tree ancestry, so the portaled preview never saw --font-print and
        // silently fell back to the system font while the in-tree thumbnail
        // and the exported PNG/PDF (captured from that same in-tree node)
        // both rendered correctly. Applying the class here, inside the
        // portaled content itself, is the fix.
        className={`flex h-[min(90vh,760px)] w-full max-w-2xl flex-col gap-3 p-4 sm:p-6 ${printFont.variable}`}
      >
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="truncate text-base font-semibold text-[var(--ink)]">{label}</DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close preview"
            className="shrink-0 rounded-full p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-2)] p-3"
        >
          {scale !== null && (
            <div
              // dir="ltr": see PrintPreviewFrame in primitives.tsx — same
              // scaled-viewport-under-RTL-ancestor clipping issue.
              dir="ltr"
              className="overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-md"
              style={{ width: dim.widthPx * scale, height: dim.heightPx * scale }}
            >
              <div
                style={{
                  width: dim.widthPx,
                  height: dim.heightPx,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                {children}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => onDownload("png")}
            disabled={exportingId !== null}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exportingId === pngKey ? "Exporting…" : "Download PNG"}
          </button>
          {dim.kind === "print" && (
            <button
              type="button"
              onClick={() => onDownload("pdf")}
              disabled={exportingId !== null}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {exportingId === pdfKey ? "Exporting…" : "Download PDF"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
