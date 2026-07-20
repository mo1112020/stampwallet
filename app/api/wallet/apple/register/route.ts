import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const passId = body.passId || body.serialNumber;
  const pushToken = body.pushToken || body.push_token;

  if (!passId || !pushToken) {
    return jsonError("passId and pushToken required", "validation_error", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Misconfigured", "misconfigured", 503);
  }

  const { error } = await admin
    .from("customer_progress")
    .update({ apple_push_token: pushToken })
    .eq("pass_id", passId);

  if (error) return jsonError(error.message, "update_failed", 500);
  console.info("[wallet:apple] registered push token for", passId);
  return jsonOk({ registered: true });
}
