"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const next = Math.min(rect.width / dim.widthPx, rect.height / dim.heightPx);
      if (next > 0) setScale(next);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, dim.widthPx, dim.heightPx]);

  const pngKey = `${templateId}-png`;
  const pdfKey = `${templateId}-pdf`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="flex h-[min(90vh,760px)] w-full max-w-2xl flex-col gap-3 p-4 sm:p-6"
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
