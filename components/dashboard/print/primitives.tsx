import type { PrintLocale } from "./copy";

export type PrintTemplateData = {
  businessName: string;
  programName: string;
  logoUrl?: string | null;
  qrValue: string;
  primaryColor: string;
  secondaryColor: string;
  locale: PrintLocale;
};

export function PrintLogo({
  logoUrl,
  businessName,
  size = 56,
  className,
}: {
  logoUrl?: string | null;
  businessName: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        flexShrink: 0,
      }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontSize: size * 0.4, fontWeight: 800, color: "#111" }}>
          {businessName.trim().charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}

export function WalletBadges({ height = 22 }: { height?: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: "#ffffff",
        borderRadius: 999,
        padding: "8px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/Apple_Wallet_icon.svg" alt="Apple Wallet" style={{ height, width: "auto" }} />
      <span style={{ width: 1, height: height * 0.8, background: "#e5e7eb" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/Google_Wallet_icon.svg" alt="Google Wallet" style={{ height, width: "auto" }} />
    </div>
  );
}

export function QrPanel({
  qrNode,
  label,
  padding = 20,
}: {
  qrNode: React.ReactNode;
  label?: string;
  padding?: number;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        background: "#ffffff",
        borderRadius: 20,
        padding,
        boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
      }}
    >
      {qrNode}
      {label && <span style={{ fontSize: 13, fontWeight: 700, color: "#111", letterSpacing: 0.2 }}>{label}</span>}
    </div>
  );
}

/** Wraps a template at its true pixel size and visually scales it down to fit a preview slot. */
export function PrintPreviewFrame({
  width,
  height,
  scale,
  children,
}: {
  width: number;
  height: number;
  scale: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ width: width * scale, height: height * scale, overflow: "hidden" }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}
