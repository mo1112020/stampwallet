import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import type { Merchant } from "@/types";
import { MerchantEditForm } from "@/components/admin/merchant-edit-form";

export default async function AdminMerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: merchant }, { data: userData }, { count: customerCount }] = await Promise.all([
    admin.from("merchants").select("*").eq("id", id).single(),
    admin.auth.admin.getUserById(id),
    admin.from("customers").select("*", { count: "exact", head: true }).eq("merchant_id", id),
  ]);

  if (!merchant) notFound();

  const m = merchant as Merchant;
  const limits = PLAN_LIMITS[m.plan];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="h-4 w-4" /> All merchants
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">{m.business_name}</h1>
        <Badge variant={m.stripe_customer_id ? "primary" : "outline"}>
          {m.stripe_customer_id ? "Stripe-managed" : "Manual"}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">{userData?.user?.email ?? "no owner email found"}</p>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Current plan limits ({m.plan})</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[var(--muted)]">Programs</dt>
            <dd className="font-medium text-[var(--ink)]">{limits.maxActivePrograms ?? "Unlimited"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Customers</dt>
            <dd className="font-medium text-[var(--ink)]">
              {(customerCount ?? 0).toLocaleString()} / {limits.maxActiveCustomers?.toLocaleString() ?? "Unlimited"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Seats</dt>
            <dd className="font-medium text-[var(--ink)]">{limits.maxSeats ?? "Unlimited"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Locations</dt>
            <dd className="font-medium text-[var(--ink)]">{limits.maxLocations ?? "Unlimited"}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Subscription</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Merchant since {new Date(m.created_at).toLocaleDateString()}.{" "}
          {m.stripe_customer_id
            ? "This merchant has a Stripe subscription -- editing here overrides it until the next webhook sync overwrites these fields again."
            : "This merchant has no Stripe subscription -- these fields are the only source of truth for their access."}
        </p>
        <div className="mt-4">
          <MerchantEditForm
            merchantId={m.id}
            initial={{
              plan: m.plan,
              plan_interval: m.plan_interval,
              subscription_status: m.subscription_status,
              current_period_ends_at: m.current_period_ends_at,
            }}
          />
        </div>
      </Card>
    </div>
  );
}
