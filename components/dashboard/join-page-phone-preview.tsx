"use client";

type Props = {
  businessName: string;
  programName: string;
  description: string;
  logoUrl?: string | null;
  backgroundColor: string;
  buttonColor: string;
  style: "classic" | "editorial" | "spotlight";
};

export function JoinPagePhonePreview({ businessName, programName, description, logoUrl, backgroundColor, buttonColor, style }: Props) {
  const spotlight = style === "spotlight";
  const editorial = style === "editorial";
  return (
    <div className="relative h-[500px] w-[235px] shrink-0 overflow-hidden rounded-[42px] border-[10px] border-[#2b2b2b] bg-white shadow-xl">
      <div className="absolute -left-[3px] top-20 h-9 w-[3px] rounded-r-sm bg-[#4a4a4a]" />
      <div className="absolute -left-[3px] top-32 h-12 w-[3px] rounded-r-sm bg-[#4a4a4a]" />
      <div className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-l-sm bg-[#4a4a4a]" />
      <div className="relative h-full overflow-hidden rounded-[32px]" style={{ backgroundColor }}>
        <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className={`absolute inset-x-4 top-3 flex items-center justify-between text-[8px] font-semibold ${spotlight ? "text-white/70" : "text-gray-500"}`}><span>9:41</span><span>●●● 5G</span></div>
        <div className={`h-full px-4 pb-4 pt-16 ${spotlight ? "text-white" : "text-[var(--ink)]"}`}>
          <div className={`${editorial ? "mt-7" : "mt-3"} ${editorial ? "text-left" : "text-center"}`}>
            <div className={`mx-auto flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl ${editorial ? "ml-0" : ""} ${spotlight ? "bg-white/15" : "bg-white shadow-sm"}`}>
              {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-lg font-bold" style={{ color: spotlight ? "white" : buttonColor }}>{businessName.slice(0, 1)}</span>}
            </div>
            <p className={`mt-2 text-[9px] font-semibold ${spotlight ? "text-white/75" : "text-gray-500"}`}>{businessName}</p>
            <h3 className={`mt-1 font-bold leading-tight ${editorial ? "text-[20px]" : "text-[16px]"}`}>{programName}</h3>
            <p className={`mt-2 line-clamp-3 text-[9px] leading-[1.45] ${spotlight ? "text-white/80" : "text-gray-600"}`}>{description}</p>
          </div>
          <div className="mt-4 rounded-xl bg-white p-3 shadow-sm">
            <p className="text-[11px] font-bold text-[var(--ink)]">Join the program</p>
            <div className="mt-3 h-7 rounded-full bg-gray-100" />
            <div className="mt-2 h-7 rounded-full bg-gray-100" />
            <div className="mt-2 h-7 rounded-full bg-gray-100" />
            <div className="mt-3 h-8 rounded-full text-center text-[9px] font-bold leading-8 text-white" style={{ backgroundColor: buttonColor }}>Join & get your pass</div>
          </div>
        </div>
      </div>
    </div>
  );
}
