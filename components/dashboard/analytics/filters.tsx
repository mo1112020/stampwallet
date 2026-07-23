"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const PRESETS = [
  { key: "7d", days: 7 },
  { key: "30d", days: 30 },
  { key: "90d", days: 90 },
] as const;

export function AnalyticsFilters({
  programs,
}: {
  programs: { id: string; name: string }[];
}) {
  const t = useTranslations("analytics");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function applyPreset(days: number) {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from.toISOString());
    params.set("to", to.toISOString());
    router.push(`${pathname}?${params.toString()}`);
  }

  function setProgram(programId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (programId) {
      params.set("program_id", programId);
    } else {
      params.delete("program_id");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeProgram = searchParams.get("program_id") ?? "";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-full border border-[var(--line)] p-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => applyPreset(preset.days)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          >
            {t(`range.${preset.key}`)}
          </button>
        ))}
      </div>

      {programs.length > 0 && (
        <select
          value={activeProgram}
          onChange={(e) => setProgram(e.target.value)}
          className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)]"
        >
          <option value="">{t("allPrograms")}</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
