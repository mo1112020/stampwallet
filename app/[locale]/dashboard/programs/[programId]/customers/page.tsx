import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Download, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProgressVisual } from "@/components/dashboard/progress-visual";
import { StaggerGroup } from "@/components/motion/stagger-group";
import type { ProgramConfig, ProgramType, Progress } from "@/types";

export default async function ProgramCustomersPage({
  params,
}: {
  params: Promise<{ locale: string; programId: string }>;
}) {
  const { locale, programId } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("name, type, config")
    .eq("id", programId)
    .eq("merchant_id", user!.id)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("customer_progress")
    .select("id, pass_id, progress, customers(name, email, phone), loyalty_programs!inner(merchant_id)")
    .eq("program_id", programId)
    .eq("loyalty_programs.merchant_id", user!.id);

  const customers = rows ?? [];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          {program?.name ? `${program.name} — Customers` : "Customers"}
        </h1>
        <Link
          href={`/api/customers/export?program_id=${programId}`}
          className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Link>
      </div>

      {customers.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-12 text-center">
          <Users className="h-8 w-8 text-[var(--muted)]" strokeWidth={1.5} />
          <p className="text-[var(--muted)]">No customers enrolled yet.</p>
        </div>
      ) : (
        <StaggerGroup className="mt-8 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {customers.map((row) => {
            const customer = row.customers as unknown as {
              name: string | null;
              email: string | null;
              phone: string | null;
            } | null;
            return (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--ink)]">{customer?.name || "Anonymous"}</p>
                  <p className="truncate text-sm text-[var(--muted)]">
                    {customer?.email || customer?.phone || row.pass_id}
                  </p>
                </div>
                {program && (
                  <ProgressVisual
                    type={program.type as ProgramType}
                    config={program.config as ProgramConfig}
                    progress={row.progress as Progress}
                  />
                )}
              </div>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
