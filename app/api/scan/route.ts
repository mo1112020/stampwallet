import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { pushWalletUpdate } from "@/lib/wallet/push";
import { triggerAutomatedNotification } from "@/lib/notifications/campaigns";
import { scanSchema } from "@/lib/validators";
import type { Customer, LoyaltyProgram, Merchant, Progress } from "@/types";

export async function POST(request: Request) {
  const auth = await requireCapability("scan");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const rateLimitKey = `scan:${parsed.data.action}:${parsed.data.pass_id}`;
  const rateLimitWindowMs = parsed.data.action === "award" ? 10_000 : 3_000;
  const ok = await checkRateLimit(rateLimitKey, rateLimitWindowMs);
  if (!ok) {
    return jsonError("Please wait a few seconds before scanning again", "rate_limited", 429);
  }

  const { data: row, error } = await auth.supabase
    .from("customer_progress")
    .select("*, loyalty_programs(*, merchants(*)), customers(*)")
    .eq("pass_id", parsed.data.pass_id)
    .single();

  if (error || !row) return jsonError("Pass not found", "not_found", 404);

  const program = row.loyalty_programs as unknown as LoyaltyProgram & { merchants: Merchant };
  const merchant = program.merchants;
  const customer = row.customers as unknown as Customer;

  if (program.merchant_id !== auth.merchantId) {
    return jsonError("Forbidden", "forbidden", 403);
  }
  if (!program.is_active) {
    return jsonError("Program is inactive", "inactive", 400);
  }

  // The pre-checks above (ownership, is_active) are a fast, friendly early
  // exit — the RPC below re-verifies both authoritatively from inside the
  // same locked transaction that computes and writes the new progress, so
  // there's no gap between "checked" and "written" for a concurrent request
  // to slip through. See supabase/migrations/019_atomic_scan_events.sql.
  const { data: rpcRows, error: rpcError } = await auth.supabase.rpc("record_scan_event", {
    p_pass_id: parsed.data.pass_id,
    p_merchant_id: auth.merchantId,
    p_scanned_by: auth.userId,
    p_action: parsed.data.action,
    p_amount: parsed.data.amount ?? null,
  });

  if (rpcError || !rpcRows || rpcRows.length === 0) {
    const message = rpcError?.message ?? "";
    if (message.includes("not_found")) return jsonError("Pass not found", "not_found", 404);
    if (message.includes("forbidden")) return jsonError("Forbidden", "forbidden", 403);
    if (message.includes("inactive")) return jsonError("Program is inactive", "inactive", 400);
    if (message.includes("reward_not_earned")) {
      return jsonError("This reward hasn't been earned yet", "reward_not_earned", 400);
    }
    return jsonError(message || "Update failed", "update_failed", 500);
  }

  const {
    progress: nextProgress,
    resulted_in_reward: resultedInReward,
    reward_description: rewardDescription,
  } = rpcRows[0] as {
    progress: Progress;
    resulted_in_reward: boolean;
    reward_description: string;
    delta: Record<string, number>;
  };

  const rewardUnlockedNotification =
    parsed.data.action === "award" && resultedInReward && merchant.notification_prefs?.reward_unlocked;

  if (rewardUnlockedNotification) {
    // Delivers the routine progress refresh AND the notification in one
    // push (triggerAutomatedNotification calls pushWalletUpdate itself) —
    // avoids double-pushing the same pass.
    await triggerAutomatedNotification({
      trigger: "reward_unlocked",
      title: "Reward unlocked!",
      message: `🎁 ${rewardDescription || "You've unlocked a reward!"} Come redeem it.`,
      target: {
        customerProgressId: row.id,
        passId: row.pass_id,
        googleObjectId: row.google_object_id,
        program,
        merchant,
        progress: nextProgress,
        enrolledAt: row.created_at,
      },
      // Unlike every other automated trigger, this one fires right off a
      // scan that just changed stamps_collected/points — the hero image
      // genuinely needs to reflect that, so this is the one place that
      // overrides triggerAutomatedNotification's skip-by-default.
      skipHeroImageRefresh: false,
    });
  } else {
    await pushWalletUpdate({
      passId: row.pass_id,
      googleObjectId: row.google_object_id,
      program,
      merchant,
      progress: nextProgress,
      enrolledAt: row.created_at,
    });
  }

  return jsonOk({
    progress: nextProgress,
    reward_available: resultedInReward || parsed.data.action === "redeem",
    reward_description: rewardDescription,
    pass_id: row.pass_id,
    program: { id: program.id, name: program.name, type: program.type },
    customer: customer
      ? { name: customer.name, phone: customer.phone, email: customer.email }
      : null,
  });
}
