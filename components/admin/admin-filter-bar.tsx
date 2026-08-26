"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLANS = ["free", "starter", "pro", "enterprise"];
const STATUSES = ["active", "trialing", "past_due", "paused", "canceled"];

export function AdminFilterBar({ q, plan, status }: { q: string; plan: string; status: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(q);

  function apply(next: { q?: string; plan?: string; status?: string }) {
    const params = new URLSearchParams({ q, plan, status, ...next });
    for (const [key, value] of [...params]) if (!value) params.delete(key);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form
        className="min-w-[220px] flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: search });
        }}
      >
        <Input
          placeholder="Search business or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>
      <Select value={plan || "all"} onValueChange={(v) => apply({ plan: v === "all" ? "" : v })}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All plans" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All plans</SelectItem>
          {PLANS.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status || "all"} onValueChange={(v) => apply({ status: v === "all" ? "" : v })}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
