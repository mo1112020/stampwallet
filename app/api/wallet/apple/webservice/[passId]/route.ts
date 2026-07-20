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

  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    const since = new Date(ifModifiedSince).getTime();
    const updated = new Date(row.updated_at).getTime();
    if (!Number.isNaN(since) && updated <= since) {
      return new Response(null, { status: 304 });
    }
  }

  const programRaw = row.loyalty_programs as unknown as LoyaltyProgram & {
    merchants: Merchant;
  };

  const result = await generateApplePass({
    passId: passId,
    program: programRaw,
    merchant: programRaw.merchants,
    progress: row.progress as Progress,
  });

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Last-Modified": new Date(row.updated_at).toUTCString(),
    },
  });
}
