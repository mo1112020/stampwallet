import type Stripe from "stripe";
import { hasActiveAccess } from "@/lib/billing/access";
import { disableCardExpirationForMerchant } from "@/lib/billing/enforcement";
import { planForStripePriceId } from "@/lib/billing/plans";
import { createStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/types";

const SUBSCRIPTION_EVENTS = new Set(["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature") ?? "";
  const rawBody = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  if (!signature || !rawBody || !secret) {
    return Response.json({ error: "Missing signature, body, or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = createStripeClient();
    // Throws on signature mismatch or an expired timestamp — a forged
    // request and a rotated-but-not-yet-redeployed secret both land here.
    // Reject with 4xx either way: Stripe does not retry 4xx responses,
    // which is correct for a genuinely invalid signature (retrying won't
    // help) and safe for the misconfiguration case (fixing the secret and
    // redeploying is the actual remedy, not a retry).
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await processEvent(event);
    return Response.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

function extractMerchantId(obj: unknown): string | null {
  const metadata = (obj as { metadata?: Record<string, unknown> | null } | null | undefined)?.metadata;
  const raw = metadata?.merchant_id;
  return typeof raw === "string" ? raw : null;
}

async function processEvent(event: Stripe.Event) {
  const admin = createAdminClient();

  // Idempotency + audit log — Stripe redelivers the same event id on retry
  // (and merchants can trigger duplicate deliveries by replaying events from
  // the dashboard), and this table is also the support/debugging trail (see
  // migration 016_stripe_billing.sql). The unique(provider, event_id)
  // constraint is what actually enforces idempotency; a 23505 here means
  // we've already handled this exact delivery.
  const { error: logError } = await admin.from("billing_events").insert({
    provider: "stripe",
    event_id: event.id,
    event_type: event.type,
    merchant_id: extractMerchantId(event.data.object),
    payload: event as unknown as Record<string, unknown>,
  });

  if (logError) {
    if (logError.code === "23505") return; // already processed this delivery
    console.error("Failed to log billing event:", logError);
    return;
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(admin, event.data.object as Stripe.Checkout.Session);
    return;
  }

  if (SUBSCRIPTION_EVENTS.has(event.type)) {
    await syncSubscription(admin, event.data.object as Stripe.Subscription);
    return;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    await syncFromInvoice(admin, event.data.object as Stripe.Invoice);
    return;
  }

  // Every other subscribed event type is still logged above (audit trail)
  // but doesn't need to mutate merchant state.
}

/** The only event where a brand-new subscription's id first becomes known
 * to us — session.subscription is a bare id, not the full object, so we
 * re-fetch it and run it through the same sync path as every other
 * subscription event rather than duplicating the sync logic here. */
async function handleCheckoutCompleted(admin: ReturnType<typeof createAdminClient>, session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription" || !session.subscription) return;
  const stripe = createStripeClient();
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscription(admin, subscription, extractMerchantId(session));
}

/** invoice.paid / invoice.payment_failed don't carry a full subscription
 * object — re-fetching the live subscription and running it through the
 * same sync path guarantees merchants.subscription_status always reflects
 * Stripe's canonical current state rather than a hand-rolled partial
 * update derived from the invoice alone. */
async function syncFromInvoice(admin: ReturnType<typeof createAdminClient>, invoice: Stripe.Invoice) {
  // invoice.parent.subscription_details.subscription is the current
  // ("flexible billing") shape. A webhook endpoint pinned to an older API
  // version delivers the pre-2025 shape instead, where the same id sits at
  // the top-level invoice.subscription — fall back to that so this stays
  // correct regardless of which API version the endpoint is pinned to.
  const legacyInvoice = invoice as unknown as { subscription?: string | Stripe.Subscription | null };
  const subscriptionRef = invoice.parent?.subscription_details?.subscription ?? legacyInvoice.subscription;
  if (!subscriptionRef) return;
  const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;
  const stripe = createStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscription(admin, subscription);
}

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "paused":
      return "paused";
    // incomplete/incomplete_expired: first payment never went through, no
    // access was ever granted. unpaid: dunning exhausted. All three map to
    // the same "no paid access" bucket as a genuine cancellation.
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    default:
      return "canceled";
  }
}

async function syncSubscription(admin: ReturnType<typeof createAdminClient>, sub: Stripe.Subscription, merchantIdHint?: string | null) {
  const merchantId = merchantIdHint ?? extractMerchantId(sub);
  const item = sub.items.data[0];
  const priceId = item?.price?.id;
  const planInfo = planForStripePriceId(priceId);
  // Downgrade exactly when access.ts says access is gone — keeps this
  // handler and the UI's access checks from silently drifting apart.
  const status = mapStatus(sub.status);
  const isEnded = !hasActiveAccess(status);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  // items.data[].current_period_end is the current ("flexible billing")
  // shape. `sub` here is sometimes the raw object off a webhook event
  // (customer.subscription.*), whose shape follows whatever API version
  // that webhook endpoint is pinned to — an older pin still puts this on
  // the subscription itself. Prefer the modern field, fall back to the
  // legacy one, so this is correct either way.
  const legacySub = sub as unknown as { current_period_end?: number };
  const periodEnd = item?.current_period_end ?? legacySub.current_period_end;

  const update: Record<string, unknown> = {
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId ?? null,
    subscription_status: status,
    current_period_ends_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    // Set only when a cancellation is scheduled but not yet effective —
    // Stripe keeps the subscription (and therefore paid access) running
    // until the current period ends even after cancel_at_period_end is set.
    scheduled_cancel_at: sub.cancel_at_period_end && periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    ...(isEnded
      ? { plan: "free", plan_interval: null }
      : planInfo
        ? { plan: planInfo.plan, plan_interval: planInfo.interval }
        : {}),
  };

  // metadata.merchant_id (set at checkout, see checkout route) is
  // authoritative and the only signal available on a subscription's very
  // first event. Once a merchant row has synced once, stripe_subscription_id
  // and stripe_customer_id are reliable fallbacks even if metadata is ever
  // missing (e.g. a change made from Stripe's own dashboard).
  const lookups: Array<[string, string]> = merchantId
    ? [["id", merchantId]]
    : [
        ["stripe_subscription_id", sub.id],
        ["stripe_customer_id", customerId],
      ];

  let resolvedMerchantId: string | null = null;
  for (const [column, value] of lookups) {
    const { data, error } = await admin.from("merchants").update(update).eq(column, value).select("id").maybeSingle();
    if (error) throw error;
    if (data) {
      resolvedMerchantId = data.id;
      break;
    }
  }

  if (!resolvedMerchantId) {
    console.error(`Stripe webhook: no merchant matched subscription ${sub.id} (customer ${customerId})`);
    return;
  }

  if (isEnded) {
    await disableCardExpirationForMerchant(admin, resolvedMerchantId);
  }
}
