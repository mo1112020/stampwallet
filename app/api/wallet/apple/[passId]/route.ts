import { jsonError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApplePass } from "@/lib/wallet/apple";
import type { LoyaltyProgram, Merchant, Progress } from "@/types";

type Ctx = { params: Promise<{ passId: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const { passId } = await params;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Misconfigured", "misconfigured", 503);
  }

  const { data: row } = await admin
    .from("customer_progress")
    .select("*, loyalty_programs(*, merchants(*))")
    .eq("pass_id", passId)
    .maybeSingle();

  if (!row) return jsonError("Pass not found", "not_found", 404);

  const token = new URL(request.url).searchParams.get("token");
  if (token !== row.apple_auth_token) {
    return jsonError("Unauthorized", "unauthorized", 401);
  }

  const programRaw = row.loyalty_programs as unknown as LoyaltyProgram & {
    merchants: Merchant;
  };

  const result = await generateApplePass({
    passId: passId,
    program: programRaw,
    merchant: programRaw.merchants,
    progress: row.progress as Progress,
    authenticationToken: row.apple_auth_token,
    latestNotificationMessage: row.latest_notification_message,
  });

  return new Response(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${passId}.${result.stub ? "json" : "pkpass"}"`,
    },
  });
}
