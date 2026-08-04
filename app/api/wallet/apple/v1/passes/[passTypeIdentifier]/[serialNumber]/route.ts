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

  const programRaw = row.loyalty_programs as unknown as LoyaltyProgram & { merchants: Merchant };

  // Apple wakes the device with a bare APNs ping (no payload — see
  // lib/wallet/apple.ts's pushApplePassUpdate) and expects the device's own
  // conditional re-fetch here to decide whether anything actually changed.
  // row.updated_at is customer_progress.updated_at, which only moves on a
  // scan/enrollment — a merchant editing the *program* (photo, reward text,
  // colors) or their *merchant branding* only bumps loyalty_programs.updated_at
  // / merchants.updated_at, neither of which customer_progress ever reflects.
  // Comparing against row.updated_at alone meant every program/branding-only
  // push returned a stale 304 here — Wallet believed nothing had changed and
  // never re-downloaded the pass, so the card silently never updated even
  // though the APNs wake and the DB write both succeeded. Comparing against
  // whichever of the three actually changed most recently fixes that.
  const lastModified = new Date(
    Math.max(
      new Date(row.updated_at).getTime(),
      new Date(programRaw.updated_at).getTime(),
      new Date(programRaw.merchants.updated_at).getTime()
    )
  );

  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    const since = new Date(ifModifiedSince).getTime();
    if (!Number.isNaN(since) && lastModified.getTime() <= since) {
      return new Response(null, { status: 304 });
    }
  }

  const result = await generateApplePass({
    passId: serialNumber,
    program: programRaw,
    merchant: programRaw.merchants,
    progress: row.progress as Progress,
    authenticationToken: row.apple_auth_token,
    latestNotificationMessage: row.latest_notification_message,
    enrolledAt: row.created_at,
  });

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Last-Modified": lastModified.toUTCString(),
    },
  });
}
