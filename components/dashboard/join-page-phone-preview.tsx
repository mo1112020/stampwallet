"use client";

import { readableTextColor } from "@/lib/print/color";

type Props = {
  businessName: string;
  programName: string;
  description: string;
  logoUrl?: string | null;
  backgroundColor: string;
  buttonColor: string;
  style: "classic" | "editorial" | "spotlight";
};

/**
 * Mirrors the real page's color logic (app/[locale]/pass/new/page.tsx) exactly: text
 * color is computed from the actual chosen background, not read off the dashboard's
 * own theme — otherwise a merchant configuring this in dark mode would see a preview
 * that no longer matches what customers actually get on the (theme-independent) real
 * join page.
 */
export function JoinPagePhonePreview({ businessName, programName, description, logoUrl, backgroundColor, buttonColor, style }: Props) {
  const editorial = style === "editorial";
  const textColor = readableTextColor(backgroundColor);
  const onDark = textColor === "#ffffff";
  return (
    <div className="relative h-[500px] w-[235px] shrink-0 overflow-hidden rounded-[42px] border-[10px] border-[#2b2b2b] bg-white shadow-xl">
      <div className="absolute -left-[3px] top-20 h-9 w-[3px] rounded-r-sm bg-[#4a4a4a]" />
      <div className="absolute -left-[3px] top-32 h-12 w-[3px] rounded-r-sm bg-[#4a4a4a]" />
      <div className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-l-sm bg-[#4a4a4a]" />
      <div className="relative h-full overflow-hidden rounded-[32px]" style={{ backgroundColor }}>
        <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div
          className="absolute inset-x-4 top-3 flex items-center justify-between text-[8px] font-semibold"
          style={{ color: textColor, opacity: 0.7 }}
        >
          <span>9:41</span>
          <span>●●● 5G</span>
        </div>
        <div className="h-full px-4 pb-4 pt-16" style={{ color: textColor }}>
          <div className={`${editorial ? "mt-7" : "mt-3"} ${editorial ? "text-left" : "text-center"}`}>
            <div
              className={`mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl shadow-sm ${editorial ? "ml-0" : ""}`}
              style={{ background: onDark ? "rgba(255,255,255,0.15)" : "#ffffff" }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold" style={{ color: onDark ? "#ffffff" : buttonColor }}>
                  {businessName.slice(0, 1)}
                </span>
              )}
            </div>
            <p className="mt-2 text-[9px] font-semibold" style={{ opacity: 0.75 }}>
              {businessName}
            </p>
            <h3 className={`mt-1 font-bold leading-tight ${editorial ? "text-[20px]" : "text-[16px]"}`} style={{ color: textColor }}>
              {programName}
            </h3>
            <p className="mt-2 line-clamp-3 text-[9px] leading-[1.45]" style={{ opacity: 0.75 }}>
              {description}
            </p>
          </div>
          <div className="mt-4 rounded-xl bg-white p-3 shadow-sm">
            <p className="text-[11px] font-bold text-[#1c1c1c]">Join the program</p>
            <div className="mt-3 h-7 rounded-full bg-gray-100" />
            <div className="mt-2 h-7 rounded-full bg-gray-100" />
            <div className="mt-2 h-7 rounded-full bg-gray-100" />
            <div className="mt-3 h-8 rounded-full text-center text-[9px] font-bold leading-8 text-white" style={{ backgroundColor: buttonColor }}>
              Join & get your pass
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
