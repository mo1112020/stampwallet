import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Postgres-backed rate limit check (see migration 004) — a plain in-process
 * Map doesn't work across serverless instances, each of which has its own
 * empty map.
 *
 * Default behavior fails OPEN (allows the request) if the DB check itself
 * errors, so a rate-limiter outage can't take down an authenticated,
 * correctness-guarded-elsewhere path like /api/scan (see
 * supabase/migrations/019_atomic_scan_events.sql — that RPC, not this rate
 * limiter, is the real guard against double-award). Pass `failOpen: false`
 * for public/unauthenticated, cost-incurring endpoints (e.g.
 * /api/customers/enroll) where the rate limiter is the *only* abuse guard —
 * for those, a DB error should block the request rather than remove the one
 * throttle that exists.
 */
export async function checkRateLimit(
  key: string,
  windowMs = 10_000,
  options: { failOpen?: boolean } = {}
): Promise<boolean> {
  const failOpen = options.failOpen ?? true;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_window_ms: windowMs,
    });
    if (error) {
      console.error(`[rate-limit] check failed, failing ${failOpen ? "open" : "closed"}:`, error.message);
      return failOpen;
    }
    return Boolean(data);
  } catch (err) {
    console.error(`[rate-limit] misconfigured, failing ${failOpen ? "open" : "closed"}:`, err);
    return failOpen;
  }
}
