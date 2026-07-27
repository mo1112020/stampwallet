import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGoogleWalletLink } from "@/lib/wallet/google";
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
  if (token !== row.google_auth_token) {
    return jsonError("Unauthorized", "unauthorized", 401);
  }

  const programRaw = row.loyalty_programs as unknown as LoyaltyProgram & {
    merchants: Merchant;
  };

  const link = await generateGoogleWalletLink({
    passId: passId,
    program: programRaw,
    merchant: programRaw.merchants,
    progress: row.progress as Progress,
    enrolledAt: row.created_at,
  });

  // This endpoint's only job is handing back a real pay.google.com save
  // link for the client to redirect to. When Google Wallet isn't
  // configured (or the real API call failed), generateGoogleWalletLink
  // falls back to a local stub URL rather than a real save link — that
  // must surface as a request failure here, not a 200 with a fake link,
  // otherwise a caller that blindly redirects to `saveUrl` sends the
  // customer to an unrelated page instead of Google Wallet.
  if (link.stub) {
    return jsonError(
      "Google Wallet isn't available right now. Please try again later.",
      "google_wallet_unavailable",
      503
    );
  }

  return jsonOk(link);
}
