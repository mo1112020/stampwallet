import { jsonError, jsonOk } from "@/lib/api";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Pre-flight throttle for login/signup/password-reset — called by those
 * pages BEFORE they call supabase.auth.*, which happens directly from the
 * browser to Supabase's own API and never touches this app's server at
 * all, so there's no route this app owns that a real proxy could rate-limit
 * on the actual auth call itself. This is a deliberate, narrower fix: a
 * real app-level throttle against abuse coming through this app's own UI,
 * not a full rewrite of how login/signup establish a session. Someone
 * bypassing the UI entirely and calling Supabase's auth API directly would
 * evade this specific check — same exposure as before this existed, not
 * worse — and is bounded by Supabase's own project-level rate limits.
 *
 * Windows are a minimum gap between allowed attempts (see
 * check_rate_limit, migration 004_hardening.sql — it's a throttle, not a
 * "N per window" counter): tight enough to meaningfully slow a scripted
 * brute-force/credential-stuffing/email-bombing run, loose enough that a
 * real person retrying a mistyped password or re-requesting a reset link
 * isn't blocked by their own legitimate retry.
 */
const WINDOW_MS: Record<string, number> = {
  login: 3_000,
  signup: 5_000,
  password_reset: 10_000,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : null;
  const windowMs = action ? WINDOW_MS[action] : undefined;
  if (!windowMs) {
    return jsonError("Invalid action", "validation_error", 400);
  }

  const ip = request.headers.get("x-forwarded-for") || "anon";

  // Public, unauthenticated, and this check is the only app-level abuse
  // guard on these flows — a rate-limiter DB error should block the
  // request rather than silently remove the one throttle that exists here
  // (same reasoning as app/api/customers/enroll/route.ts).
  const ok = await checkRateLimit(`auth:${action}:${ip}`, windowMs, { failOpen: false });
  if (!ok) {
    return jsonError("Too many attempts. Please wait a moment and try again.", "rate_limited", 429);
  }

  return jsonOk({ ok: true });
}
