import { jsonError, jsonOk, requireMerchant } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";
import { applyAward, applyRedeem } from "@/lib/scan/progress";
import { pushWalletUpdate } from "@/lib/wallet/push";
import { scanSchema } from "@/lib/validators";
import type { ProgramConfig, ProgramType, Progress } from "@/types";

export async function POST(request: Request) {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  if (parsed.data.action === "award") {
    const ok = checkRateLimit(`scan:${parsed.data.pass_id}`, 10_000);
    if (!ok) {
      return jsonError("Please wait a few seconds before scanning again", "rate_limited", 429);
    }
  }

  const { data: row, error } = await auth.supabase
    .from("customer_progress")
    .select("*, loyalty_programs(*)")
    .eq("pass_id", parsed.data.pass_id)
    .single();

  if (error || !row) return jsonError("Pass not found", "not_found", 404);

  const program = row.loyalty_programs as unknown as {
    id: string;
    merchant_id: string;
    type: ProgramType;
    config: ProgramConfig;
    is_active: boolean;
  };

  if (program.merchant_id !== auth.userId) {
    return jsonError("Forbidden", "forbidden", 403);
  }
  if (!program.is_active) {
    return jsonError("Program is inactive", "inactive", 400);
  }

  let nextProgress: Progress;
  let delta: Record<string, number>;
  let resultedInReward = false;
  let rewardDescription = "";

  if (parsed.data.action === "award") {
    const result = applyAward(
      program.type,
      program.config,
      row.progress as Progress,
      parsed.data.amount
    );
    nextProgress = result.progress;
    delta = result.delta;
    resultedInReward = result.resultedInReward;
    rewardDescription = result.rewardDescription;
  } else {
    const result = applyRedeem(program.type, program.config, row.progress as Progress);
    nextProgress = result.progress;
    delta = result.delta;
    rewardDescription = result.rewardDescription;
  }

  const { data: updated, error: updateError } = await auth.supabase
    .from("customer_progress")
    .update({ progress: nextProgress })
    .eq("id", row.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    return jsonError(updateError?.message ?? "Update failed", "update_failed", 500);
  }

  await auth.supabase.from("scan_events").insert({
    customer_progress_id: row.id,
    scanned_by: auth.userId,
    delta,
    resulted_in_reward: resultedInReward,
  });

  if (parsed.data.action === "redeem") {
    await auth.supabase.from("redemptions").insert({
      customer_progress_id: row.id,
      reward_description: rewardDescription,
    });
  }

  await pushWalletUpdate({
    passId: row.pass_id,
    applePushToken: row.apple_push_token,
    googleObjectId: row.google_object_id,
  });

  return jsonOk({
    progress: updated.progress,
    reward_available: resultedInReward || parsed.data.action === "redeem",
    reward_description: rewardDescription,
    pass_id: row.pass_id,
  });
}
