import { createAdminClient } from "@/lib/supabase/admin";
import { pushApplePassUpdate } from "@/lib/wallet/apple";
import { pushGooglePassUpdate } from "@/lib/wallet/google";
import type { LoyaltyProgram, Merchant, Progress } from "@/types";

export async function pushWalletUpdate(params: {
  passId: string;
  googleObjectId: string | null;
  program: LoyaltyProgram;
  merchant: Merchant;
  progress: Progress;
}) {
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

  await Promise.all([
    pushApplePassUpdate(params.passId, pushTokens),
    pushGooglePassUpdate(
      params.passId,
      params.googleObjectId,
      params.program,
      params.merchant,
      params.progress
    ),
  ]);
}
