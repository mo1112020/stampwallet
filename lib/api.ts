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

type ResolvedSession = { ok: true; session: SessionContext } | { ok: false; reason: string };

/**
 * Resolves the current session as either the merchant owner
 * (merchants.id === auth.uid()) or an active staff member acting on
 * behalf of a merchant. A staff row still in "invited" status is
 * auto-flipped to "active" here — reaching this code means they already
 * completed Supabase's invite-acceptance flow (that's how they got a
 * session at all), so this is the first authenticated request we see
 * from them, not a separate confirmation step to build.
 *
 * Shared core for requireSession() (API routes, wraps failures as a
 * NextResponse) and getSessionOrNull() (server components/layouts, e.g.
 * the Scanner PWA's auth-gated layout, where a redirect is more
 * appropriate than a JSON error).
 */
async function resolveSession(): Promise<ResolvedSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "unauthorized" };
  }

  const { data: ownMerchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (ownMerchant) {
    return {
      ok: true,
      session: {
        supabase,
        userId: user.id,
        merchantId: ownMerchant.id,
        role: "owner",
        merchant: ownMerchant as Merchant,
      },
    };
  }

  const { data: staffRow } = await supabase
    .from("staff_accounts")
    .select("*, merchants(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staffRow) {
    return { ok: false, reason: "no_account" };
  }
  if (staffRow.status === "revoked") {
    return { ok: false, reason: "revoked" };
  }

  if (staffRow.status === "invited") {
    await supabase.from("staff_accounts").update({ status: "active" }).eq("id", staffRow.id);
  }

  return {
    ok: true,
    session: {
      supabase,
      userId: user.id,
      merchantId: staffRow.merchant_id,
      role: staffRow.role as StaffRole,
      merchant: staffRow.merchants as unknown as Merchant,
    },
  };
}

export async function requireSession(): Promise<SessionContext | { error: NextResponse }> {
  const resolved = await resolveSession();
  if (resolved.ok) return resolved.session;

  const status = resolved.reason === "revoked" ? 403 : 401;
  return { error: jsonError(resolved.reason, resolved.reason, status) };
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

/** For server components/layouts — no session (or an invalid one) is just `null`, not a thrown error. */
export async function getSessionOrNull(): Promise<SessionContext | null> {
  const resolved = await resolveSession();
  return resolved.ok ? resolved.session : null;
}
