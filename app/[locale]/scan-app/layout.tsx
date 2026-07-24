import type { Metadata, Viewport } from "next";
import { RegisterServiceWorker } from "@/components/scanner/register-sw";

// Shell for the Scanner PWA (installable, standalone) — deliberately not
// wrapped in the main dashboard's nav/topbar, and deliberately not
// auth-gated here: /scan-app/login lives under this same layout, and an
// auth check here would redirect it to itself in a loop. The actual auth
// gate is the sibling (app)/layout.tsx route group.
export const metadata: Metadata = {
  title: "StampWallet Scanner",
  description: "Scan customer loyalty passes, award stamps/points, and redeem rewards.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Scanner",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  // Next's `appleWebApp.capable` only emits the modern generic
  // "mobile-web-app-capable" tag — older iOS Safari versions specifically
  // need the Apple-prefixed one to launch installed PWAs in true
  // standalone mode instead of Safari's browser chrome.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#3E0856",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function ScanAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <RegisterServiceWorker />
      {children}
    </div>
  );
}
