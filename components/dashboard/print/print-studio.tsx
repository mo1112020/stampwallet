"use client";

import { useRef, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { printFont } from "@/lib/fonts/print";
import { exportNodeAsPdf, exportNodeAsPng } from "@/lib/print/export";
import { PRINT_COPY, type PrintLocale } from "./copy";
import { PrintPreviewFrame, type PrintTemplateData } from "./primitives";
import { TEMPLATE_DIMENSIONS, type TemplateId } from "./dimensions";
import {
  A4Poster,
  CounterStand,
  TableTent,
  Flyer,
  WindowSticker,
  QrOnly,
  SocialSquare,
  InstagramStory,
} from "./templates";

const TEMPLATE_CONFIG: { id: TemplateId; label: string; Component: typeof A4Poster }[] = [
  { id: "a4Poster", label: "A4 poster", Component: A4Poster },
  { id: "counterStand", label: "Counter stand", Component: CounterStand },
  { id: "tableTent", label: "Table tent", Component: TableTent },
  { id: "flyer", label: "Flyer", Component: Flyer },
  { id: "windowSticker", label: "Window sticker", Component: WindowSticker },
  { id: "qrOnly", label: "QR only", Component: QrOnly },
  { id: "socialSquare", label: "Square social", Component: SocialSquare },
  { id: "instagramStory", label: "Instagram Story", Component: InstagramStory },
];

const PREVIEW_WIDTH = 220;

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "stampwallet";
}

export function PrintStudio({
  businessName,
  logoUrl,
  programName,
  programId,
  primaryColor,
  secondaryColor,
}: {
  businessName: string;
  logoUrl?: string | null;
  programName: string;
  programId: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  const [assetLocale, setAssetLocale] = useState<PrintLocale>("en");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const nodeRefs = useRef<Map<TemplateId, HTMLDivElement>>(new Map());

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const qrValue = `${appUrl}/${assetLocale}/pass/new?program=${programId}`;

  const data: PrintTemplateData = {
    businessName,
    programName,
    logoUrl,
    qrValue,
    primaryColor,
    secondaryColor,
    locale: assetLocale,
  };

  async function handleDownload(id: TemplateId, format: "png" | "pdf") {
    const node = nodeRefs.current.get(id);
    if (!node) return;
    const dim = TEMPLATE_DIMENSIONS[id];
    const key = `${id}-${format}`;
    setExportingId(key);
    try {
      const filename = `${slugify(businessName)}-${slugify(id)}-${assetLocale}`;
      if (format === "png") {
        await exportNodeAsPng(node, `${filename}.png`);
      } else if (dim.widthMm && dim.heightMm) {
        await exportNodeAsPdf(node, `${filename}.pdf`, dim.widthMm, dim.heightMm);
      }
    } catch {
      toast.error("Couldn't generate that file. Try again.");
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className={printFont.variable}>
      <div className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] p-1 text-sm font-semibold w-fit">
        {(["en", "ar"] as PrintLocale[]).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setAssetLocale(code)}
            className={cn(
              "rounded-full px-4 py-1.5 transition-colors",
              assetLocale === code ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"
            )}
          >
            {code === "en" ? "English" : "العربية"}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">{PRINT_COPY[assetLocale].instructions}</p>

      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {TEMPLATE_CONFIG.map(({ id, label, Component }) => {
          const dim = TEMPLATE_DIMENSIONS[id];
          const scale = PREVIEW_WIDTH / dim.widthPx;
          const pngKey = `${id}-png`;
          const pdfKey = `${id}-pdf`;
          return (
            <Card key={id} className="flex flex-col items-center gap-3 p-4">
              <div className="overflow-hidden rounded-lg border border-[var(--line)] shadow-sm" style={{ width: PREVIEW_WIDTH, height: dim.heightPx * scale }}>
                <PrintPreviewFrame width={dim.widthPx} height={dim.heightPx} scale={scale}>
                  <Component
                    ref={(el) => {
                      if (el) nodeRefs.current.set(id, el);
                      else nodeRefs.current.delete(id);
                    }}
                    {...data}
                  />
                </PrintPreviewFrame>
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
              <div className="flex w-full flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDownload(id, "png")}
                  disabled={exportingId !== null}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exportingId === pngKey ? "Exporting…" : "PNG"}
                </button>
                {dim.kind === "print" && (
                  <button
                    type="button"
                    onClick={() => handleDownload(id, "pdf")}
                    disabled={exportingId !== null}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[var(--line)] px-3 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {exportingId === pdfKey ? "Exporting…" : "PDF"}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
