"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { PhoneMockup, type PhoneMockupProps } from "@/components/dashboard/phone-mockup";
import { A4Poster } from "@/components/dashboard/print/templates";
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
  const t = useTranslations("programs");
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
      // Deliberately omitted: this quick A4 poster download always uses the
      // standard QR code regardless of the program's wallet barcode style,
      // same as the full print studio — BarcodeImage defaults to "qr".
    });

    await new Promise((resolve) => setTimeout(resolve, QR_RENDER_DELAY_MS));
    if (posterRef.current) {
      // Dynamic import, not a top-level one — jsPDF + html-to-image are
      // ~400KB combined, and this component renders on the Programs list
      // (one of the most-visited dashboard pages) for every card whether or
      // not this button is ever clicked. Deferring the import to the click
      // handler means that weight only loads for a merchant who actually
      // downloads a poster.
      const { exportNodeAsPdf } = await import("@/lib/print/export");
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
        businessName={businessName}
        logoUrl={logoUrl}
        secondaryAction={{ icon: Download, label: t("downloadPoster"), onClick: downloadPoster, loading: downloading }}
      />
      {posterData && (
        <div style={{ position: "fixed", left: -9999, top: 0, pointerEvents: "none" }} aria-hidden="true">
          <A4Poster ref={posterRef} {...posterData} />
        </div>
      )}
    </>
  );
}
