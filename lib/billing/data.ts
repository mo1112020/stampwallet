import type { SessionContext } from "@/lib/api";
import { PLAN_LIMITS, isPaddleConfigured } from "@/lib/billing/plans";
import { countSeats } from "@/lib/billing/seats";
import { createPaddleClient } from "@/lib/paddle";
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
  /** Smallest currency unit (cents for USD), matching Stripe's
   * amount_paid convention this type originally modeled — components
   * dividing by 100 to display don't need to change. */
  amount_paid: number;
  currency: string;
  status: string | null;
  /** Unix seconds, matching Stripe's `created` convention this type
   * originally modeled. */
  created: number;
  hosted_invoice_url: string | null;
};

export async function getBillingInvoices(session: SessionContext): Promise<BillingInvoice[]> {
  if (!isPaddleConfigured() || !session.merchant.paddle_customer_id) {
    return [];
  }

  const paddle = createPaddleClient();
  const transactions = paddle.transactions.list({
    customerId: [session.merchant.paddle_customer_id],
    perPage: 12,
    status: ["billed", "paid", "completed", "past_due"],
  });

  const invoices: BillingInvoice[] = [];
  for await (const tx of transactions) {
    // Only transactions that actually reached billing have an invoice PDF —
    // a transaction can exist in other states (e.g. draft) with nothing to
    // fetch yet. Per-transaction try/catch so one missing PDF doesn't blank
    // out the whole list.
    let hostedInvoiceUrl: string | null = null;
    try {
      const pdf = await paddle.transactions.getInvoicePDF(tx.id);
      hostedInvoiceUrl = pdf.url;
    } catch {
      // No PDF available yet for this transaction — not an error state.
    }

    invoices.push({
      id: tx.id,
      amount_paid: Number(tx.details?.totals?.grandTotal ?? "0"),
      currency: tx.currencyCode,
      status: tx.status,
      created: Math.floor(new Date(tx.billedAt ?? tx.createdAt).getTime() / 1000),
      hosted_invoice_url: hostedInvoiceUrl,
    });

    if (invoices.length >= 12) break;
  }

  return invoices;
}
