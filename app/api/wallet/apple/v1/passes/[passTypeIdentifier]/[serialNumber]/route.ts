import { createAdminClient } from "@/lib/supabase/admin";
import { generateApplePass } from "@/lib/wallet/apple";
import type { LoyaltyProgram, Merchant, Progress } from "@/types";

type Ctx = { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const { serialNumber } = await params;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return new Response(null, { status: 503 });
  }

  const { data: row } = await admin
    .from("customer_progress")
    .select("*, loyalty_programs(*, merchants(*))")
    .eq("pass_id", serialNumber)
    .maybeSingle();

  if (!row) return new Response(null, { status: 404 });

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("ApplePass ") ? authHeader.slice("ApplePass ".length) : null;
  if (token !== row.apple_auth_token) {
    return new Response(null, { status: 401 });
  }

  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    const since = new Date(ifModifiedSince).getTime();
    const updated = new Date(row.updated_at).getTime();
    if (!Number.isNaN(since) && updated <= since) {
      return new Response(null, { status: 304 });
    }
  }

  const programRaw = row.loyalty_programs as unknown as LoyaltyProgram & { merchants: Merchant };

  const result = await generateApplePass({
    passId: serialNumber,
    program: programRaw,
    merchant: programRaw.merchants,
    progress: row.progress as Progress,
    authenticationToken: row.apple_auth_token,
  });

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Last-Modified": new Date(row.updated_at).toUTCString(),
    },
  });
}
