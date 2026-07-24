"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { PhoneMockup, type PhoneMockupProps } from "@/components/dashboard/phone-mockup";
import { A4Poster } from "@/components/dashboard/print/templates";
import { exportNodeAsPdf } from "@/lib/print/export";
import type { PrintTemplateData } from "@/components/dashboard/print/primitives";

const QR_RENDER_DELAY_MS = 500;

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "stampwallet";
}

/**
 * Programs-list card: the normal PhoneMockup manage link, plus a quick "Download A4
 * poster" shortcut that doesn't require a trip to the full print studio. Renders the
 * poster into a hidden offscreen node just long enough to rasterize it.
 */
export function ProgramCard({
  programId,
  businessName,
  logoUrl,
  primaryColor,
  secondaryColor,
  ...phoneMockupProps
}: PhoneMockupProps & {
  programId: string;
  businessName: string;
  logoUrl?: string | null;
}) {
  const [posterData, setPosterData] = useState<PrintTemplateData | null>(null);
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  async function downloadPoster() {
    setDownloading(true);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    setPosterData({
      businessName,
      programName: phoneMockupProps.name,
      logoUrl,
      qrValue: `${appUrl}/en/pass/new?program=${programId}`,
      primaryColor,
      secondaryColor,
      locale: "en",
    });

    await new Promise((resolve) => setTimeout(resolve, QR_RENDER_DELAY_MS));
    if (posterRef.current) {
      await exportNodeAsPdf(posterRef.current, `${slugify(businessName)}-${slugify(phoneMockupProps.name)}-a4-poster.pdf`, 210, 297);
    }
    setPosterData(null);
    setDownloading(false);
  }

  return (
    <>
      <PhoneMockup
        {...phoneMockupProps}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        secondaryAction={{ icon: Download, label: "Download A4 poster", onClick: downloadPoster, loading: downloading }}
      />
      {posterData && (
        <div style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none" }} aria-hidden="true">
          <A4Poster ref={posterRef} {...posterData} />
        </div>
      )}
    </>
  );
}
