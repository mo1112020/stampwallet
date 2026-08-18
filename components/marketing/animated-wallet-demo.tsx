import QRCode from "qrcode";
import { AnimatedWalletDemoClient } from "@/components/marketing/animated-wallet-demo-client";

/**
 * Animated replacement for the static WalletPreviewCard on the homepage's
 * "pocket" section — auto-plays the actual product story (stamps filling
 * in, then a wallet-native notification announcing the reward) instead of
 * a single frozen frame. Split into a server/client pair because the QR
 * code is generated the same way WalletPreviewCard does it — server-side,
 * once, at build/request time — but the fill/notification sequence needs
 * client-side GSAP.
 */
export async function AnimatedWalletDemo({
  platform,
  primaryColor = "#1f57e7",
  secondaryColor = "#ffffff",
  className,
}: {
  platform: "apple" | "google";
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}) {
  const qrSvg = await QRCode.toString("WALLETOS-PREVIEW", {
    type: "svg",
    width: 56,
    margin: 0,
    color: { dark: "#000000", light: "#00000000" },
  });

  return (
    <AnimatedWalletDemoClient
      platform={platform}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      qrSvg={qrSvg}
      className={className}
    />
  );
}
