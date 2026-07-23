import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleHasCapability, type Capability } from "@/lib/auth/permissions";
import type { Merchant, StaffRole } from "@/types";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({ error: { message, code } }, { status });
}

/**
 * Owner-only session — unchanged, still used by every route that hasn't
 * been deliberately reviewed for staff access (billing, account-level
 * settings, etc). Use requireSession()/requireCapability() for routes
 * that staff should be able to reach.
 */
export async function requireMerchant(): Promise<
  | { supabase: Awaited<ReturnType<typeof createClient>>; merchant: Merchant; userId: string }
  | { error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: jsonError("Unauthorized", "unauthorized", 401) };
  }

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !merchant) {
    return { error: jsonError("Merchant not found", "merchant_not_found", 401) };
  }

  return { supabase, merchant: merchant as Merchant, userId: user.id };
}

export type SessionContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  merchantId: string;
  role: StaffRole;
  merchant: Merchant;
};

/**
 * Resolves the current session as either the merchant owner
 * (merchants.id === auth.uid()) or an active staff member acting on
 * behalf of a merchant. A staff row still in "invited" status is
 * auto-flipped to "active" here — reaching this code means they already
 * completed Supabase's invite-acceptance flow (that's how they got a
 * session at all), so this is the first authenticated request we see
 * from them, not a separate confirmation step to build.
 */
export async function requireSession(): Promise<SessionContext | { error: NextResponse }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: jsonError("Unauthorized", "unauthorized", 401) };
  }

  const { data: ownMerchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (ownMerchant) {
    return {
      supabase,
      userId: user.id,
      merchantId: ownMerchant.id,
      role: "owner",
      merchant: ownMerchant as Merchant,
    };
  }

  const { data: staffRow } = await supabase
    .from("staff_accounts")
    .select("*, merchants(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staffRow) {
    return { error: jsonError("No merchant account found for this session", "no_account", 401) };
  }
  if (staffRow.status === "revoked") {
    return { error: jsonError("This account has been revoked", "revoked", 403) };
  }

  if (staffRow.status === "invited") {
    await supabase.from("staff_accounts").update({ status: "active" }).eq("id", staffRow.id);
  }

  return {
    supabase,
    userId: user.id,
    merchantId: staffRow.merchant_id,
    role: staffRow.role as StaffRole,
    merchant: staffRow.merchants as unknown as Merchant,
  };
}

export async function requireCapability(
  capability: Capability
): Promise<SessionContext | { error: NextResponse }> {
  const session = await requireSession();
  if ("error" in session) return session;

  if (!roleHasCapability(session.role, capability)) {
    return { error: jsonError("Forbidden", "forbidden", 403) };
  }

  return session;
}
