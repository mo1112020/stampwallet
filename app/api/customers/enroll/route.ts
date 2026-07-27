import { jsonError, jsonOk } from "@/lib/api";
import { PLAN_LIMITS, isWithinLimit } from "@/lib/billing/plans";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { initialProgress } from "@/lib/wallet/renderPassFields";
import { generateApplePass } from "@/lib/wallet/apple";
import { generateGoogleWalletLink } from "@/lib/wallet/google";
import { enrollSchema } from "@/lib/validators";
import type { LoyaltyProgram, Merchant, ProgramConfig, ProgramType } from "@/types";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anon";
  if (!(await checkRateLimit(`enroll:${ip}`, 5_000))) {
    return jsonError("Too many enrollment attempts", "rate_limited", 429);
  }

  const body = await request.json();
  const parsed = enrollSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server is not configured with Supabase service role", "misconfigured", 503);
  }

  const { data: program, error: programError } = await admin
    .from("loyalty_programs")
    .select("*, merchants(*)")
    .eq("id", parsed.data.program_id)
    .eq("is_active", true)
    .single();

  if (programError || !program) {
    return jsonError("Program not found", "not_found", 404);
  }

  const merchant = program.merchants as unknown as Merchant;
  const limits = PLAN_LIMITS[merchant.plan];

  const { count } = await admin
    .from("customer_progress")
    .select("*, loyalty_programs!inner(merchant_id)", { count: "exact", head: true })
    .eq("loyalty_programs.merchant_id", merchant.id);

  if (!isWithinLimit(count ?? 0, limits.maxActiveCustomers)) {
    return jsonError("This program has reached its customer cap", "plan_limit", 403);
  }

  const progress = initialProgress(program.type as ProgramType, program.config as ProgramConfig);

  // Atomic find-or-create: if this person (matched by phone or email, for
  // this merchant) already has a customer record and/or is already
  // enrolled in this program, reuse that row instead of creating a
  // duplicate — see supabase/migrations/014_customer_dedup.sql.
  const { data: enrollRows, error: enrollError } = await admin.rpc("enroll_customer", {
    p_merchant_id: merchant.id,
    p_program_id: program.id,
    p_name: parsed.data.name ?? null,
    p_phone: parsed.data.phone ?? null,
    p_email: parsed.data.email ?? null,
    p_progress: progress,
  });

  const cp = enrollRows?.[0];
  if (enrollError || !cp) {
    return jsonError(enrollError?.message ?? "Enrollment failed", "create_failed", 500);
  }

  const loyaltyProgram = {
    id: program.id,
    merchant_id: program.merchant_id,
    name: program.name,
    type: program.type,
    is_active: program.is_active,
    config: program.config,
    created_at: program.created_at,
    updated_at: program.updated_at,
  } as LoyaltyProgram;

  // Use the enrollment's actual current progress, not the freshly computed
  // `progress` local — for a returning customer (re-scanning the join QR),
  // that's their real stamp/point balance, not a reset-to-zero card.
  const currentProgress = (cp.progress ?? progress) as typeof progress;

  const apple = await generateApplePass({
    passId: cp.pass_id,
    program: loyaltyProgram,
    merchant,
    progress: currentProgress,
    authenticationToken: cp.apple_auth_token,
    enrolledAt: cp.enrolled_at,
  });
  const google = await generateGoogleWalletLink({
    passId: cp.pass_id,
    program: loyaltyProgram,
    merchant,
    progress: currentProgress,
    enrolledAt: cp.enrolled_at,
  });

  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? requestUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  return jsonOk(
    {
      pass_id: cp.pass_id,
      apple_pass_url: `${appUrl}/api/wallet/apple/${cp.pass_id}?token=${cp.apple_auth_token}`,
      google_wallet_url: google.saveUrl.startsWith("http")
        ? google.saveUrl
        : `${appUrl}${google.saveUrl}`,
      stub: { apple: apple.stub, google: google.stub },
    },
    201
  );
}
