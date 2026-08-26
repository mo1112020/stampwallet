import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Merchant } from "@/types";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  active: "success",
  trialing: "success",
  past_due: "warning",
  paused: "danger",
  canceled: "danger",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminMerchantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim().toLowerCase() || "";
  const planFilter = sp.plan || "";
  const statusFilter = sp.status || "";

  const admin = createAdminClient();

  // Owner email lives on auth.users, not merchants -- listUsers() is the
  // only way to read it (auth.users isn't queryable via postgrest), same
  // precedent already used in lib/email/triggers.tsx. One page (up to
  // 1000) is enough at this app's current scale.
  const [{ data: merchants }, { data: userList }, { data: customerRows }] = await Promise.all([
    admin
      .from("merchants")
      .select("id, business_name, plan, subscription_status, current_period_ends_at, stripe_customer_id")
      .order("current_period_ends_at", { ascending: true, nullsFirst: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    // One row per platform-wide customer, merchant_id only -- cheap at this
    // app's current scale (same "revisit if it grows" caveat as
    // listUsers() above). Tallied client-side rather than a grouped
    // aggregate query since PostgREST's count()-per-group syntax isn't
    // used anywhere else in this codebase.
    admin.from("customers").select("merchant_id"),
  ]);

  const emailById = new Map((userList?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const customerCountById = new Map<string, number>();
  for (const row of customerRows ?? []) {
    customerCountById.set(row.merchant_id, (customerCountById.get(row.merchant_id) ?? 0) + 1);
  }

  const rows = ((merchants ?? []) as Pick<
    Merchant,
    "id" | "business_name" | "plan" | "subscription_status" | "current_period_ends_at" | "stripe_customer_id"
  >[])
    .map((m) => ({ ...m, email: emailById.get(m.id) ?? "", customerCount: customerCountById.get(m.id) ?? 0 }))
    .filter((m) => {
      if (planFilter && m.plan !== planFilter) return false;
      if (statusFilter && m.subscription_status !== statusFilter) return false;
      if (q && !m.business_name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
      return true;
    });

  const now = Date.now();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Merchants</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {rows.length} of {merchants?.length ?? 0} merchant{merchants?.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6">
        <AdminFilterBar q={sp.q ?? ""} plan={planFilter} status={statusFilter} />
      </div>

      <Card className="mt-6 p-0">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Business</TableHead>
              <TableHead>Owner email</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid until</TableHead>
              <TableHead>Billing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => {
              const expired =
                m.current_period_ends_at &&
                new Date(m.current_period_ends_at).getTime() < now &&
                (m.subscription_status === "active" || m.subscription_status === "trialing" || m.subscription_status === "past_due");
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link href={`/merchants/${m.id}`} className="font-medium text-[var(--ink)] hover:underline">
                      {m.business_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[var(--muted)]">{m.email || "—"}</TableCell>
                  <TableCell className="font-medium text-[var(--ink)]">{m.customerCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="default">{m.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[m.subscription_status ?? ""] ?? "default"}>
                      {m.subscription_status ?? "none"}
                    </Badge>
                  </TableCell>
                  <TableCell className={expired ? "font-semibold text-[var(--danger)]" : "text-[var(--muted)]"}>
                    {formatDate(m.current_period_ends_at)}
                    {expired && " (expired)"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.stripe_customer_id ? "primary" : "outline"}>
                      {m.stripe_customer_id ? "Stripe" : "Manual"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
