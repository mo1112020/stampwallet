"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, Search } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Search/filter controls for the server-rendered customers page. Changing a
 * filter pushes a new URL (searchParams), which re-runs the page's server
 * fetch with the new query — no client-side data fetching here, just URL
 * state. The search box is debounced so typing doesn't trigger a
 * navigation per keystroke.
 */
export function CustomersToolbar({ programs }: { programs: { id: string; name: string }[] }) {
  const t = useTranslations("customers");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const filter = searchParams.get("filter") === "birthday_month" ? "birthday_month" : "all";
  const programFilter = searchParams.get("filter_program_id") ?? "";

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page"); // any search/filter change resets pagination to the first page
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const id = setTimeout(() => pushParams({ q: search || null }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="ps-11"
        />
      </div>
      <div className="flex gap-1 rounded-full bg-[var(--surface-2)] p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => pushParams({ filter: null })}
          className={cn(
            "rounded-full px-3 py-1.5 transition-colors",
            filter === "all" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          {t("filterAll")}
        </button>
        <button
          type="button"
          onClick={() => pushParams({ filter: "birthday_month" })}
          className={cn(
            "rounded-full px-3 py-1.5 transition-colors",
            filter === "birthday_month" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          {t("filterBirthday")}
        </button>
      </div>
      <Select
        value={programFilter}
        onChange={(e) => pushParams({ filter_program_id: e.target.value || null })}
        className="w-auto max-w-[180px]"
      >
        <option value="">{t("filterProgram")}</option>
        {programs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <a
        href="/api/customers/export"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
      >
        <Download className="h-4 w-4" />
        {t("export")}
      </a>
    </div>
  );
}
