import type { SessionContext } from "@/lib/api";
import { PLAN_LIMITS, isStripeConfigured } from "@/lib/billing/plans";
import { countSeats } from "@/lib/stripe/seats";
import { createStripeClient } from "@/lib/stripe";
import type { Plan } from "@/types";

export type BillingUsage = {
  plan: Plan;
  programs: { used: number; limit: number | null };
  customers: { used: number; limit: number | null };
  seats: { used: number; limit: number | null };
  locations: { used: number; limit: number | null };
};

export async function getBillingUsage(session: SessionContext): Promise<BillingUsage> {
  const [{ count: programCount }, { count: customerCount }, { count: locationCount }, seats] = await Promise.all([
    session.supabase
      .from("loyalty_programs")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", session.merchantId)
      .eq("is_active", true),
    session.supabase
      .from("customer_progress")
      .select("*, loyalty_programs!inner(merchant_id)", { count: "exact", head: true })
      .eq("loyalty_programs.merchant_id", session.merchantId),
    session.supabase.from("store_locations").select("*", { count: "exact", head: true }).eq("merchant_id", session.merchantId),
    countSeats(session.merchantId),
  ]);

  const limits = PLAN_LIMITS[session.merchant.plan];

  return {
    plan: session.merchant.plan,
    programs: { used: programCount ?? 0, limit: limits.maxActivePrograms },
    customers: { used: customerCount ?? 0, limit: limits.maxActiveCustomers },
    seats: { used: seats, limit: limits.maxSeats },
    locations: { used: locationCount ?? 0, limit: limits.maxLocations },
  };
}

export type BillingInvoice = {
  id: string;
  amount_paid: number;
  currency: string;
  status: string | null;
  created: number;
  hosted_invoice_url: string | null;
};

export async function getBillingInvoices(session: SessionContext): Promise<BillingInvoice[]> {
  if (!isStripeConfigured() || !session.merchant.stripe_customer_id) {
    return [];
  }

  const stripe = createStripeClient();
  const invoices = await stripe.invoices.list({
    customer: session.merchant.stripe_customer_id,
    limit: 12,
  });

  return invoices.data.map((inv) => ({
    id: inv.id,
    amount_paid: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    created: inv.created,
    hosted_invoice_url: inv.hosted_invoice_url ?? null,
  }));
}
