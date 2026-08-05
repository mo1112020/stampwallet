import {
  EventName,
  type EventEntity,
  type SubscriptionActivatedEvent,
  type SubscriptionCanceledEvent,
  type SubscriptionCreatedEvent,
  type SubscriptionNotification,
  type SubscriptionPastDueEvent,
  type SubscriptionPausedEvent,
  type SubscriptionResumedEvent,
  type SubscriptionTrialingEvent,
  type SubscriptionUpdatedEvent,
} from "@paddle/paddle-node-sdk";
import { hasActiveAccess } from "@/lib/billing/access";
import { disableCardExpirationForMerchant } from "@/lib/billing/enforcement";
import { planForPaddlePriceId } from "@/lib/billing/plans";
import { createPaddleClient } from "@/lib/paddle";
import { createAdminClient } from "@/lib/supabase/admin";

type SubscriptionEvent =
  | SubscriptionCreatedEvent
  | SubscriptionUpdatedEvent
  | SubscriptionCanceledEvent
  | SubscriptionActivatedEvent
  | SubscriptionPastDueEvent
  | SubscriptionPausedEvent
  | SubscriptionResumedEvent
  | SubscriptionTrialingEvent;

const SUBSCRIPTION_EVENTS = new Set<string>([
  EventName.SubscriptionCreated,
  EventName.SubscriptionUpdated,
  EventName.SubscriptionCanceled,
  EventName.SubscriptionActivated,
  EventName.SubscriptionPastDue,
  EventName.SubscriptionPaused,
  EventName.SubscriptionResumed,
  EventName.SubscriptionTrialing,
]);

export async function POST(request: Request) {
  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();
  const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? "";

  if (!signature || !rawBody || !secret) {
    return Response.json({ error: "Missing signature, body, or secret" }, { status: 400 });
  }

  try {
    const paddle = createPaddleClient();
    // Throws on signature mismatch, expired timestamp, or malformed event —
    // caught below and turned into a non-2xx so Paddle retries. A tampered
    // request and a rotated-but-not-yet-redeployed secret look identical
    // here; retrying is harmless for the former and self-heals the latter.
    const event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
    if (event) await processEvent(event);
    return Response.json({ received: true });
  } catch (err) {
    console.error("Paddle webhook error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

function extractMerchantId(customData: Record<string, unknown> | null | undefined): string | null {
  const raw = customData?.merchant_id;
  return typeof raw === "string" ? raw : null;
}

async function processEvent(event: EventEntity) {
  const admin = createAdminClient();

  const customData = (event.data as { customData?: Record<string, unknown> | null } | undefined)?.customData;

  // Idempotency + audit log — Paddle redelivers the same eventId on retry,
  // and this table is also the support/debugging trail (see migration
  // 015_paddle_billing.sql). The unique(provider, event_id) constraint is
  // what actually enforces idempotency; a 23505 here means we've already
  // handled this exact delivery.
  const { error: logError } = await admin.from("billing_events").insert({
    provider: "paddle",
    event_id: event.eventId,
    event_type: event.eventType,
    merchant_id: extractMerchantId(customData),
    payload: event as unknown as Record<string, unknown>,
  });

  if (logError) {
    if (logError.code === "23505") return; // already processed this delivery
    console.error("Failed to log billing event:", logError);
    return;
  }

  if (SUBSCRIPTION_EVENTS.has(event.eventType)) {
    await syncSubscription(admin, (event as SubscriptionEvent).data);
  }
}

async function syncSubscription(admin: ReturnType<typeof createAdminClient>, sub: SubscriptionNotification) {
  const merchantId = extractMerchantId(sub.customData);
  const priceId = sub.items[0]?.price?.id;
  const planInfo = planForPaddlePriceId(priceId);
  // Downgrade exactly when access.ts says access is gone — keeps this
  // handler and the UI's access checks from silently drifting apart.
  const isEnded = !hasActiveAccess(sub.status);

  const update: Record<string, unknown> = {
    paddle_customer_id: sub.customerId,
    paddle_subscription_id: sub.id,
    paddle_price_id: priceId ?? null,
    subscription_status: sub.status,
    current_period_ends_at: sub.nextBilledAt,
    scheduled_cancel_at: sub.scheduledChange?.action === "cancel" ? sub.scheduledChange.effectiveAt : null,
    ...(isEnded
      ? { plan: "free", plan_interval: null }
      : planInfo
        ? { plan: planInfo.plan, plan_interval: planInfo.interval }
        : {}),
  };

  // customData.merchant_id (set at checkout, see checkout route) is
  // authoritative and the only signal available on a subscription's very
  // first event. Once a merchant row has synced once, paddle_subscription_id
  // and paddle_customer_id are reliable fallbacks even if customData is
  // ever missing (e.g. a change made from Paddle's own retention flows).
  const lookups: Array<[string, string]> = merchantId
    ? [["id", merchantId]]
    : [
        ["paddle_subscription_id", sub.id],
        ["paddle_customer_id", sub.customerId],
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
    console.error(`Paddle webhook: no merchant matched subscription ${sub.id} (customer ${sub.customerId})`);
    return;
  }

  if (isEnded) {
    await disableCardExpirationForMerchant(admin, resolvedMerchantId);
  }
}
