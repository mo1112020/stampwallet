import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Users } from "lucide-react";
import { getSessionOrNull } from "@/lib/api";
import { roleHasCapability } from "@/lib/auth/permissions";
import { listAllCustomers } from "@/lib/customers/queries";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { CustomersToolbar } from "@/components/dashboard/customers-toolbar";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">{value.toLocaleString()}</p>
    </Card>
  );
}

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; filter?: string; filter_program_id?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("customers");

  const session = await getSessionOrNull();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  if (!roleHasCapability(session.role, "view_analytics")) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">{t("noAccess")}</p>
      </div>
    );
  }

  const sp = await searchParams;
  const search = sp.q?.trim() || undefined;
  const filterProgramId = sp.filter_program_id || undefined;
  const filter = sp.filter === "birthday_month" ? "birthday_month" : null;
  const hasActiveQuery = Boolean(search) || filter === "birthday_month" || Boolean(filterProgramId);

  const [{ customers, stats }, { data: programs }] = await Promise.all([
    listAllCustomers(session, { search, filterProgramId, filter }),
    session.supabase.from("loyalty_programs").select("id, name").eq("merchant_id", session.merchantId).order("name"),
  ]);

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

      <CustomersToolbar programs={programs ?? []} />

      <div className="mt-6">
        {customers.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 p-12 text-center">
            <Users className="h-8 w-8 text-[var(--muted)]" strokeWidth={1.5} />
            <p className="text-[var(--muted)]">{hasActiveQuery ? t("noResults") : t("noCustomers")}</p>
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
