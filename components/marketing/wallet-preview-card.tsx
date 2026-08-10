import { Coffee } from "lucide-react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

/**
 * Illustrative phone + wallet-card mockup for public marketing pages —
 * deliberately NOT the dashboard's PhoneMockup (components/dashboard/
 * phone-mockup.tsx), which is data-driven off a real program's config and
 * pulls in dashboard-only code (print barcode rendering, expiration logic).
 * This is presentational only, but mirrors that component's actual visual
 * treatment (diagonal gradient card, stamp fill colors, real QR) so a real
 * card and this marketing mockup read as the same product, not two
 * different-looking designs.
 */
export async function WalletPreviewCard({
  platform,
  primaryColor = "#1f57e7",
  secondaryColor = "#ffffff",
  stampsTotal = 8,
  stampsCollected = 5,
  className,
}: {
  platform: "apple" | "google";
  primaryColor?: string;
  secondaryColor?: string;
  stampsTotal?: number;
  stampsCollected?: number;
  className?: string;
}) {
  const badgeSrc = platform === "apple" ? "/images/Apple_Wallet_icon.svg" : "/images/Google_Wallet_icon.svg";
  const badgeLabel = platform === "apple" ? "Apple Wallet" : "Google Wallet";
  const qrSvg = await QRCode.toString("WALLETOS-PREVIEW", {
    type: "svg",
    width: 56,
    margin: 0,
    color: { dark: "#000000", light: "#00000000" },
  });

  return (
    <div className={cn("relative mx-auto h-[420px] w-[210px] shrink-0", className)}>
      <div className="relative h-full w-full overflow-hidden rounded-[38px] border-[8px] border-[#2b2b2b] bg-white shadow-xl">
        <div className="absolute top-2.5 left-1/2 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
        <div className="h-9" />
        <div className="px-2.5">
          <div className="mb-2 flex items-center gap-1.5 px-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeSrc} alt="" aria-hidden="true" className="h-3.5 w-auto" />
            <span className="text-[9px] font-medium text-[var(--muted)]">{badgeLabel}</span>
          </div>
          <div className="overflow-hidden rounded-2xl text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
            <div
              className="relative h-[150px] w-full overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${secondaryColor}99, ${primaryColor})` }}
            >
              <div className="absolute inset-0 grid place-content-center gap-1.5 px-3" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }} aria-hidden="true">
                {Array.from({ length: stampsTotal }).map((_, i) => {
                  const filled = i < stampsCollected;
                  return (
                    <div
                      key={i}
                      className="flex h-6 w-6 items-center justify-center rounded-full border"
                      style={{
                        backgroundColor: filled ? secondaryColor : "rgba(255,255,255,0.12)",
                        borderColor: filled ? secondaryColor : "rgba(255,255,255,0.6)",
                      }}
                    >
                      <Coffee className="h-3 w-3" style={{ color: filled ? "#fff" : secondaryColor }} strokeWidth={2} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[9px]">
              <div>
                <p className="uppercase tracking-wide opacity-60">Stamps to reward</p>
                <p className="text-[11px] font-bold">{Math.max(0, stampsTotal - stampsCollected)} left</p>
              </div>
              <div className="text-end">
                <p className="uppercase tracking-wide opacity-60">Reward</p>
                <p className="text-[11px] font-bold">Free coffee</p>
              </div>
            </div>
            <div className="mx-3 mb-3 mt-2 flex flex-col items-center rounded-xl bg-white px-2 py-1.5">
              <div className="flex h-14 w-14 items-center justify-center" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="mt-0.5 text-[7px] text-gray-400">Tap ••• for details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
