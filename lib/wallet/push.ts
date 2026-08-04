import { createAdminClient } from "@/lib/supabase/admin";
import { pushApplePassUpdate } from "@/lib/wallet/apple";
import { pushGooglePassUpdate } from "@/lib/wallet/google";
import { resolveSegmentTargets } from "@/lib/notifications/segments";
import type { LoyaltyProgram, Merchant, Progress } from "@/types";

export type WalletPushResult = {
  /** true only when this platform had a real installed pass to push to
   * (an Apple push token or a Google object id) — a customer who only has
   * the other wallet installed isn't a failure for this platform, they're
   * simply not applicable. */
  applicable: boolean;
  ok: boolean;
};

export async function pushWalletUpdate(params: {
  passId: string;
  googleObjectId: string | null;
  program: LoyaltyProgram;
  merchant: Merchant;
  progress: Progress;
  /** Phase 8: set when this push is delivering a notification (campaign or
   * automated trigger), not just a routine post-scan progress refresh. */
  notification?: { title: string; message: string } | null;
  /** customer_progress.created_at — powers the card-expiration premium feature. */
  enrolledAt?: string;
}): Promise<{ apple: WalletPushResult; google: WalletPushResult }> {
  let pushTokens: string[] = [];
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("apple_device_registrations")
      .select("push_token")
      .eq("serial_number", params.passId);
    pushTokens = (data ?? []).map((row) => row.push_token as string);
  } catch {
    // No service role configured in this environment — Apple push is a no-op.
  }

  const [appleResult, googleResult] = await Promise.all([
    pushApplePassUpdate(params.passId, pushTokens),
    pushGooglePassUpdate(
      params.passId,
      params.googleObjectId,
      params.program,
      params.merchant,
      params.progress,
      params.notification,
      params.enrolledAt
    ),
  ]);

  // `stub: true` from either push function covers two very different cases
  // that callers need to tell apart: "not configured at all" (nothing to
  // report as failed) and "this customer has no pass on this platform"
  // (also nothing to report as failed) — both already collapse to the same
  // stub flag inside apple.ts/google.ts, so applicability here is re-derived
  // from what we actually know: a real push token, or a real object id.
  return {
    apple: { applicable: pushTokens.length > 0, ok: appleResult.ok },
    google: { applicable: Boolean(params.googleObjectId), ok: googleResult.ok },
  };
}

/** Bounds one target's push so a single hung wallet-platform request can't
 * wedge the whole broadcast loop below forever — same structural backstop
 * lib/notifications/campaigns.ts uses for the same reason. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Refreshes every enrolled customer's Apple/Google wallet card for one
 * program — called after a merchant edits program config (reward text,
 * colors, background image, icon, stamps required, etc.) so existing
 * installed cards pick up the change instead of silently going stale until
 * the customer's next scan. Reuses resolveSegmentTargets (same targeting
 * logic notification campaigns already use) with scope "program" to get
 * every current customer_progress row for it, each with the freshly-updated
 * program config attached.
 */
export async function pushProgramUpdateToAllCustomers(merchantId: string, programId: string) {
  const targets = await resolveSegmentTargets(merchantId, { scope: "program", program_id: programId });

  for (const target of targets) {
    try {
      await withTimeout(
        pushWalletUpdate({
          passId: target.passId,
          googleObjectId: target.googleObjectId,
          program: target.program,
          merchant: target.merchant,
          progress: target.progress,
          enrolledAt: target.enrolledAt,
        }),
        // Google's side of this push is much heavier than Apple's (fetch
        // background image, render + upload a fresh hero image, then the
        // Google API call) — 25s was tight enough that it read as "Android
        // always fails" when in fact it was routinely timing out, not
        // erroring. Apple's push (a couple of APNs calls) finishes in a
        // fraction of this regardless.
        45000,
        `program update push to ${target.customerProgressId}`
      );
    } catch (err) {
      console.error("[wallet:push] program update push failed for", target.customerProgressId, err);
    }
  }
}
