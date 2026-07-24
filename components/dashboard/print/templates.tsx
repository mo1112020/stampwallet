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
        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.08, margin: 0, maxWidth: 560, color: text }}>{data.programName}</h1>
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
      <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, lineHeight: 1.2, color: text }}>{data.programName}</h2>
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

// 5. Flyer — Bold — diagonal color split, oversized type, for a grand-opening / promo feel.
export const FlyerBold = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.flyerBold;
  const t = PRINT_COPY[data.locale];
  return (
    <div ref={ref} style={{ ...rootStyle(data, widthPx, heightPx), background: "#0b0b0c" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${data.primaryColor}, ${shade(data.primaryColor, -15)} 55%, #0b0b0c 55%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: shade(data.primaryColor, 25),
          opacity: 0.35,
        }}
      />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "48px 40px", color: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={52} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{data.businessName}</span>
        </div>

        <div style={{ marginTop: 56 }}>
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", opacity: 0.85 }}>{t.joinTheProgram}</span>
          <h1 style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.03, margin: "12px 0 0", maxWidth: 440 }}>{data.programName}</h1>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
          <div style={{ maxWidth: 220 }}>
            <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.5, margin: 0 }}>{t.instructions}</p>
            <div style={{ marginTop: 16 }}>
              <WalletBadges height={20} />
            </div>
          </div>
          <QrPanel padding={16} qrNode={<QrCodeImage value={data.qrValue} size={130} dark="#111111" />} />
        </div>
      </div>
    </div>
  );
});
FlyerBold.displayName = "FlyerBold";

// 6. Flyer — Minimal — generous white space, thin rules, editorial serif headline.
export const FlyerMinimal = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.flyerMinimal;
  const t = PRINT_COPY[data.locale];
  return (
    <div ref={ref} style={{ ...rootStyle(data, widthPx, heightPx), background: "#ffffff", display: "flex", flexDirection: "column", padding: "56px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={40} />
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#111" }}>{data.businessName}</span>
      </div>

      <div style={{ width: 40, height: 2, background: data.primaryColor, margin: "40px 0 32px" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: data.primaryColor }}>{t.joinTheProgram}</span>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#111",
            margin: 0,
            lineHeight: 1.15,
            maxWidth: 420,
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {data.programName}
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: 0, maxWidth: 380 }}>{t.instructions}</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 24, paddingTop: 32, borderTop: "1px solid #e5e7eb" }}>
        <div style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 12 }}>
          <QrCodeImage value={data.qrValue} size={104} dark="#111111" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#111" }}>{t.scanToJoin}</span>
          <WalletBadges height={18} />
        </div>
      </div>
      <span style={{ marginTop: 20, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#9ca3af" }}>{t.poweredBy}</span>
    </div>
  );
});
FlyerMinimal.displayName = "FlyerMinimal";

// 7. Flyer — Geometric — playful overlapping circles in brand colors.
export const FlyerGeometric = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.flyerGeometric;
  const t = PRINT_COPY[data.locale];
  return (
    <div ref={ref} style={{ ...rootStyle(data, widthPx, heightPx), background: "#f7f7f5" }}>
      <div
        style={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: data.primaryColor,
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 120,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: data.secondaryColor || shade(data.primaryColor, 30),
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -70,
          right: -70,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: shade(data.primaryColor, -20),
          opacity: 0.85,
        }}
      />
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "44px 40px", color: "#111" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={48} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>{data.businessName}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, marginTop: 40 }}>
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: shade(data.primaryColor, -25) }}>
            {t.joinTheProgram}
          </span>
          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1, margin: 0, maxWidth: 400 }}>{data.programName}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24 }}>
          <QrPanel padding={16} qrNode={<QrCodeImage value={data.qrValue} size={120} dark="#111111" />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{t.scanToJoin}</span>
            <WalletBadges height={20} />
          </div>
        </div>
      </div>
    </div>
  );
});
FlyerGeometric.displayName = "FlyerGeometric";

// 8. Flyer — Corporate — structured side panel, professional two-tone layout.
export const FlyerCorporate = forwardRef<HTMLDivElement, PrintTemplateData>((data, ref) => {
  const { widthPx, heightPx } = TEMPLATE_DIMENSIONS.flyerCorporate;
  const t = PRINT_COPY[data.locale];
  const text = readableTextColor(data.primaryColor);
  const isRtl = data.locale === "ar";
  const dotColor = text === "#ffffff" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
  return (
    <div ref={ref} style={{ ...rootStyle(data, widthPx, heightPx), background: "#ffffff", display: "flex", flexDirection: isRtl ? "row-reverse" : "row" }}>
      <div
        style={{
          width: "34%",
          color: text,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "36px 24px",
          background: `radial-gradient(${dotColor} 1.5px, transparent 1.5px) 0 0/14px 14px, linear-gradient(200deg, ${data.primaryColor}, ${shade(data.primaryColor, -25)})`,
        }}
      >
        <PrintLogo logoUrl={data.logoUrl} businessName={data.businessName} size={48} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>{data.businessName}</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "40px 32px", gap: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: data.primaryColor }}>{t.joinTheProgram}</span>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111", margin: 0, lineHeight: 1.15 }}>{data.programName}</h1>
        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{t.instructions}</p>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <QrPanel padding={14} qrNode={<QrCodeImage value={data.qrValue} size={116} dark="#111111" />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{t.scanToJoin}</span>
            <WalletBadges height={18} />
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>{t.poweredBy}</span>
      </div>
    </div>
  );
});
FlyerCorporate.displayName = "FlyerCorporate";

// 9. Window sticker — circular safe zone for an adhesive die-cut.
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

// 10. QR-only — QR-dominant, minimal chrome, for a register or door.
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

// 11. Square social — Instagram/Facebook feed post.
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
      <h1 style={{ fontSize: 64, fontWeight: 800, margin: 0, lineHeight: 1.1, maxWidth: 800, color: text }}>{data.programName}</h1>
      <QrPanel padding={32} label={t.scanToJoin} qrNode={<QrCodeImage value={data.qrValue} size={260} dark="#111111" />} />
      <WalletBadges height={30} />
    </div>
  );
});
SocialSquare.displayName = "SocialSquare";

// 12. Instagram Story — vertical 9:16, top/bottom kept clear of platform UI.
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
        <h1 style={{ fontSize: 68, fontWeight: 800, margin: 0, lineHeight: 1.1, color: text }}>{data.programName}</h1>
        <QrPanel padding={32} label={t.scanToJoin} qrNode={<QrCodeImage value={data.qrValue} size={280} dark="#111111" />} />
      </div>

      <WalletBadges height={30} />
    </div>
  );
});
InstagramStory.displayName = "InstagramStory";
