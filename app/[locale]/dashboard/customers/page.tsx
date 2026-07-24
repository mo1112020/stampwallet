"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Search, Users } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { cn } from "@/lib/utils";

type CustomerRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  created_at: string;
  cardsCount: number;
  programs: string[];
  hasApple: boolean;
  hasGoogle: boolean;
};

type Filter = "all" | "birthday_month";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">{value.toLocaleString()}</p>
    </Card>
  );
}

export default function CustomersPage() {
  const t = useTranslations("customers");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [stats, setStats] = useState({ totalCustomers: 0, totalCards: 0, totalScans: 0 });
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [programFilter, setProgramFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (filter === "birthday_month") params.set("filter", "birthday_month");
    if (programFilter) params.set("filter_program_id", programFilter);

    const res = await fetch(`/api/customers?${params.toString()}`);
    const json = await res.json();
    if (res.ok) {
      setCustomers(json.data?.customers ?? []);
      setStats(json.data?.stats ?? { totalCustomers: 0, totalCards: 0, totalScans: 0 });
    }
    setLoading(false);
  }, [search, filter, programFilter]);

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((json) => setPrograms(json.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl">
      <Reveal as="div">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("intro")}</p>
      </Reveal>

      <StaggerGroup className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile label={t("totalCustomers")} value={stats.totalCustomers} />
        <StatTile label={t("cardsInstalled")} value={stats.totalCards} />
        <StatTile label={t("transactions")} value={stats.totalScans} />
      </StaggerGroup>

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
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors",
              filter === "all" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"
            )}
          >
            {t("filterAll")}
          </button>
          <button
            type="button"
            onClick={() => setFilter("birthday_month")}
            className={cn(
              "rounded-full px-3 py-1.5 transition-colors",
              filter === "birthday_month" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"
            )}
          >
            {t("filterBirthday")}
          </button>
        </div>
        <Select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="w-auto max-w-[180px]">
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

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">{t("loading")}</p>
        ) : customers.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <Users className="h-8 w-8 text-[var(--muted)]" strokeWidth={1.5} />
            <p className="text-[var(--muted)]">{search || filter !== "all" || programFilter ? t("noResults") : t("noCustomers")}</p>
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-start text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  <th className="px-4 py-3 text-start">{t("columnName")}</th>
                  <th className="px-4 py-3 text-start">{t("columnCreated")}</th>
                  <th className="px-4 py-3 text-start">{t("columnBirthday")}</th>
                  <th className="px-4 py-3 text-start">{t("columnPhone")}</th>
                  <th className="px-4 py-3 text-start">{t("columnCards")}</th>
                  <th className="px-4 py-3 text-start">{t("columnWallet")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {customers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[var(--surface-2)]">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">{c.name || t("unknownCustomer")}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {c.birthday ? new Date(c.birthday).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">{c.phone || c.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)]">
                        {c.cardsCount}
                      </span>
                      {c.programs.length > 0 && (
                        <span className="ms-2 truncate text-xs text-[var(--muted)]">{c.programs.join(", ")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {c.hasApple && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src="/images/Apple_Wallet_icon.svg" alt="Apple Wallet" className="h-4 w-auto" />
                        )}
                        {c.hasGoogle && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src="/images/Google_Wallet_icon.svg" alt="Google Wallet" className="h-4 w-auto" />
                        )}
                        {!c.hasApple && !c.hasGoogle && <span className="text-[var(--muted)]">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
