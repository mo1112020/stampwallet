import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: rows } = await supabase
    .from("customer_progress")
    .select("id, pass_id, progress, customers(name, email, phone), loyalty_programs!inner(merchant_id)")
    .eq("program_id", programId)
    .eq("loyalty_programs.merchant_id", user!.id);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
          Customers
        </h1>
        <Link
          href={`/api/customers/export?program_id=${programId}`}
          className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm"
        >
          Export CSV
        </Link>
      </div>
      <ul className="mt-8 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {(rows ?? []).length === 0 && (
          <li className="p-6 text-[var(--muted)]">No customers enrolled yet.</li>
        )}
        {(rows ?? []).map((row) => {
          const customer = row.customers as unknown as {
            name: string | null;
            email: string | null;
            phone: string | null;
          } | null;
          return (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{customer?.name || "Anonymous"}</p>
                <p className="text-sm text-[var(--muted)]">
                  {customer?.email || customer?.phone || row.pass_id}
                </p>
              </div>
              <pre className="text-xs text-[var(--muted)]">{JSON.stringify(row.progress)}</pre>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
