import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api";

function allowlist(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return allowlist().includes(email.toLowerCase());
}

export type PlatformAdminSession = { userId: string; email: string };

type PlatformAdminResult =
  | { status: "no_session" }
  | { status: "forbidden"; email: string }
  | { status: "mfa_enroll_required" }
  | { status: "mfa_challenge_required" }
  | { status: "ok"; session: PlatformAdminSession };

/**
 * For app/admin/layout.tsx. Five distinct states, not two: no session at
 * all (redirect to /login), a valid session that just isn't on the
 * allowlist (render an inline "not authorized" message instead — this
 * person IS logged in, so redirecting back to /login would just bounce
 * them straight back here via proxy.ts's isAdminLogin check, an infinite
 * loop), an allowlisted session with no verified TOTP factor yet, an
 * allowlisted session with a factor that hasn't been challenged this
 * session, and a fully-cleared session.
 *
 * This is the platform's only cross-tenant surface (full read/write over
 * every merchant's billing via the service-role client) — a password alone
 * is what every merchant login already relies on, so this one specifically
 * requires reaching aal2 (a verified TOTP factor) before "ok", not just an
 * authenticated + allowlisted user.
 */
export async function getPlatformAdminOrNull(): Promise<PlatformAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "no_session" };
  if (!isPlatformAdminEmail(user.email)) return { status: "forbidden", email: user.email ?? "" };

  // listFactors()'s per-type arrays (.totp) only ever contain verified
  // factors -- unverified ones only show up in .all.
  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  if (!factorsData?.totp.length) return { status: "mfa_enroll_required" };

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData && aalData.currentLevel !== aalData.nextLevel) return { status: "mfa_challenge_required" };

  return { status: "ok", session: { userId: user.id, email: user.email! } };
}

/**
 * For app/api/admin/** route handlers — they share no React tree with
 * app/admin/layout.tsx, so its gate never runs for them; every one of
 * these routes must call this itself, same convention as
 * requireCapability() in lib/api.ts. Anything short of "ok" (including the
 * two MFA states, which can't be resolved from a fetch() call anyway) is
 * just Forbidden here.
 */
export async function requirePlatformAdmin(): Promise<
  PlatformAdminSession | { error: ReturnType<typeof jsonError> }
> {
  const result = await getPlatformAdminOrNull();
  if (result.status === "ok") return result.session;
  if (result.status === "no_session") return { error: jsonError("Unauthorized", "unauthorized", 401) };
  return { error: jsonError("Forbidden", "forbidden", 403) };
}
