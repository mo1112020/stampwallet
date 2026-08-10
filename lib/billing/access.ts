import type { SubscriptionStatus } from "@/types";

/** Subscription statuses that currently grant paid access.
 * `past_due` is included deliberately — Stripe is mid-dunning-retry, not
 * yet failed; revoking access before the retry window closes punishes
 * customers for a temporarily declined card. `paused` and `canceled` do
 * not grant access. A scheduled cancellation (see merchants.
 * scheduled_cancel_at) does NOT affect this — access only changes once
 * status itself flips, on the later webhook event that actually applies
 * the change. */
const ACCESS_GRANTING_STATUSES: ReadonlySet<SubscriptionStatus> = new Set(["active", "trialing", "past_due"]);

export function hasActiveAccess(status: SubscriptionStatus | null): boolean {
  return status !== null && ACCESS_GRANTING_STATUSES.has(status);
}
