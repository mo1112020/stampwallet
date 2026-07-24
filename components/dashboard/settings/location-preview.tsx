"use client";

export function LocationPushPreview({
  message,
  businessName,
  logoUrl,
  active,
}: {
  message: string;
  businessName: string;
  logoUrl?: string | null;
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span
        className={
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium " +
          (active ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--surface-2)] text-[var(--muted)]")
        }
      >
        <span className={`h-2 w-2 rounded-full ${active ? "bg-[var(--success)]" : "bg-[var(--muted)]"}`} />
        {active ? "Active" : "Inactive"}
      </span>

      <div className="relative h-[420px] w-[210px] shrink-0 overflow-hidden rounded-[36px] border-[8px] border-[#2b2b2b] bg-[#e5e5e7] shadow-xl">
        <div className="absolute left-1/2 top-2.5 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3 text-[9px] font-semibold text-black/70">
          <span>9:41</span>
          <span>●●●</span>
        </div>

        <div className="absolute inset-x-3 top-[110px]">
          <div className="flex items-start gap-2 rounded-2xl bg-white/70 p-2.5 shadow-sm backdrop-blur">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-[11px] font-bold text-black">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (businessName.trim().charAt(0) || "?").toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-semibold text-black">{businessName || "Your business"}</span>
                <span className="shrink-0 text-[10px] text-black/50">now</span>
              </div>
              <p className="mt-0.5 line-clamp-3 text-[11px] leading-snug text-black/80">{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
