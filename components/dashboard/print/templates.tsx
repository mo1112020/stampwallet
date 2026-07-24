import { forwardRef } from "react";
import { PRINT_COPY } from "./copy";
import { PrintLogo, WalletBadges, QrPanel, type PrintTemplateData } from "./primitives";
import { QrCodeImage } from "./qr-code";
import { TEMPLATE_DIMENSIONS } from "./dimensions";
import { shade, readableTextColor } from "@/lib/print/color";

const FONT = "var(--font-print), ui-sans-serif, system-ui, sans-serif";

function rootStyle(data: PrintTemplateData, widthPx: number, heightPx: number): React.CSSProperties {
  return {
    width: widthPx,
    height: heightPx,
    position: "relative",
    overflow: "hidden",
    fontFamily: FONT,
    direction: data.locale === "ar" ? "rtl" : "ltr",
    boxSizing: "border-box",
  };
}

// 1. A4 Poster — the hero piece: bold, viewable from a distance.
export const A4Poster = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.a4Poster;
  const t = PRINT_COPY[data.locale];
  const text = readableTextColor(data.primaryColor);
  return (
    <div
      ref={ref}
      style={{
        ...rootStyle(data, widthPx, heightPx),
        background: `linear-gradient(165deg, ${data.primaryColor}, ${shade(data.primaryColor, -22)})`,
        color: text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "64px 56px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, alignSelf: "flex-start" }}>
        <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={64} />
        <span style={{ fontSize: 22, fontWeight: 700, opacity: 0.92 }}>{data.businessName}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.75 }}>{t.joinTheProgram}</span>
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, margin: 0, maxWidth: 560 }}>{data.programName}</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <QrPanel padding={28} label={t.scanToJoin} qrNode={<QrCodeImage value={data.qrValue} size={220} dark="#111111" />} />
        <WalletBadges height={26} />
        <p style={{ maxWidth: 420, textAlign: "center", fontSize: 15, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>{t.instructions}</p>
      </div>

      <span style={{ marginTop: 24, fontSize: 12, fontWeight: 600, opacity: 0.65 }}>{t.poweredBy}</span>
    </div>
  );
});
A4Poster.displayName = "A4Poster";

// 2. Counter stand — small vertical card for a register or counter.
export const CounterStand = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.counterStand;
  const t = PRINT_COPY[data.locale];
  const bandText = readableTextColor(data.primaryColor);
  return (
    <div ref={ref} style={{ ...rootStyle(data, widthPx, heightPx), background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: data.primaryColor,
          color: bandText,
          padding: "22px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={40} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>{data.businessName}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: "20px 24px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", textAlign: "center", margin: 0 }}>{data.programName}</h2>
        <QrPanel padding={16} label={t.scanToJoin} qrNode={<QrCodeImage value={data.qrValue} size={150} dark="#111111" />} />
        <WalletBadges height={18} />
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "#6b7280", margin: "0 20px 18px" }}>{t.instructions}</p>
    </div>
  );
});
CounterStand.displayName = "CounterStand";

// 3. Table tent — compact square card, front panel of a folded tent.
export const TableTent = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.tableTent;
  const t = PRINT_COPY[data.locale];
  const text = readableTextColor(data.primaryColor);
  return (
    <div
      ref={ref}
      style={{
        ...rootStyle(data, widthPx, heightPx),
        background: `linear-gradient(155deg, ${data.primaryColor}, ${shade(data.primaryColor, -18)})`,
        color: text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 28,
        textAlign: "center",
      }}
    >
      <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={44} />
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{data.programName}</h2>
      <QrPanel padding={12} qrNode={<QrCodeImage value={data.qrValue} size={110} dark="#111111" />} />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>{t.scanToJoin}</span>
    </div>
  );
});
TableTent.displayName = "TableTent";

// 4. Flyer — more copy, meant to be read up close.
export const Flyer = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.flyer;
  const t = PRINT_COPY[data.locale];
  const bandText = readableTextColor(data.primaryColor);
  return (
    <div ref={ref} style={{ ...rootStyle(data, widthPx, heightPx), background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <div style={{ background: data.primaryColor, color: bandText, padding: "28px 32px", display: "flex", alignItems: "center", gap: 14 }}>
        <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={48} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>{data.businessName}</span>
      </div>

      <div style={{ flex: 1, padding: "32px 32px 0", display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111", margin: 0, lineHeight: 1.15 }}>{data.programName}</h2>
        <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{t.instructions}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
          <QrPanel padding={14} qrNode={<QrCodeImage value={data.qrValue} size={128} dark="#111111" />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{t.scanToJoin}</span>
            <WalletBadges height={20} />
          </div>
        </div>
      </div>

      <div style={{ background: "#f6f6f6", padding: "14px 32px", textAlign: data.locale === "ar" ? "right" : "left" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{t.poweredBy}</span>
      </div>
    </div>
  );
});
Flyer.displayName = "Flyer";

// 5. Window sticker — circular safe zone for an adhesive die-cut.
export const WindowSticker = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.windowSticker;
  const t = PRINT_COPY[data.locale];
  const text = readableTextColor(data.primaryColor);
  return (
    <div
      ref={ref}
      style={{
        ...rootStyle(data, widthPx, heightPx),
        borderRadius: "50%",
        background: `linear-gradient(155deg, ${data.primaryColor}, ${shade(data.primaryColor, -18)})`,
        color: text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        textAlign: "center",
        padding: 36,
      }}
    >
      <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={40} />
      <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.4 }}>{t.scanToJoin}</span>
      <div style={{ background: "#fff", borderRadius: 14, padding: 10 }}>
        <QrCodeImage value={data.qrValue} size={100} dark="#111111" />
      </div>
      <WalletBadges height={14} />
    </div>
  );
});
WindowSticker.displayName = "WindowSticker";

// 6. QR-only — QR-dominant, minimal chrome, for a register or door.
export const QrOnly = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.qrOnly;
  const t = PRINT_COPY[data.locale];
  return (
    <div
      ref={ref}
      style={{
        ...rootStyle(data, widthPx, heightPx),
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        border: `10px solid ${data.primaryColor}`,
      }}
    >
      <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={40} />
      <QrCodeImage value={data.qrValue} size={240} dark="#111111" />
      <span style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{t.scanToJoin}</span>
      <span style={{ fontSize: 11, color: "#9ca3af" }}>{t.poweredBy}</span>
    </div>
  );
});
QrOnly.displayName = "QrOnly";

// 7. Square social — Instagram/Facebook feed post.
export const SocialSquare = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.socialSquare;
  const t = PRINT_COPY[data.locale];
  const text = readableTextColor(data.primaryColor);
  return (
    <div
      ref={ref}
      style={{
        ...rootStyle(data, widthPx, heightPx),
        background: `linear-gradient(160deg, ${data.primaryColor}, ${shade(data.primaryColor, -26)})`,
        color: text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        padding: 80,
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={72} />
        <span style={{ fontSize: 26, fontWeight: 700, opacity: 0.9 }}>{data.businessName}</span>
      </div>
      <h1 style={{ fontSize: 64, fontWeight: 800, margin: 0, lineHeight: 1.1, maxWidth: 800 }}>{data.programName}</h1>
      <QrPanel padding={32} label={t.scanToJoin} qrNode={<QrCodeImage value={data.qrValue} size={260} dark="#111111" />} />
      <WalletBadges height={30} />
    </div>
  );
});
SocialSquare.displayName = "SocialSquare";

// 8. Instagram Story — vertical 9:16, top/bottom kept clear of platform UI.
export const InstagramStory = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.instagramStory;
  const t = PRINT_COPY[data.locale];
  const text = readableTextColor(data.primaryColor);
  return (
    <div
      ref={ref}
      style={{
        ...rootStyle(data, widthPx, heightPx),
        background: `linear-gradient(180deg, ${shade(data.primaryColor, 8)}, ${data.primaryColor}, ${shade(data.primaryColor, -28)})`,
        color: text,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "260px 90px",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={72} />
        <span style={{ fontSize: 28, fontWeight: 700, opacity: 0.9 }}>{data.businessName}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}>
        <h1 style={{ fontSize: 68, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{data.programName}</h1>
        <QrPanel padding={32} label={t.scanToJoin} qrNode={<QrCodeImage value={data.qrValue} size={280} dark="#111111" />} />
      </div>

      <WalletBadges height={30} />
    </div>
  );
});
InstagramStory.displayName = "InstagramStory";
