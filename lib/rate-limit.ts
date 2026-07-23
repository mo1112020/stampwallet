import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Postgres-backed rate limit check (see migration 004) — a plain in-process
 * Map doesn't work across serverless instances, each of which has its own
 * empty map. Fails open (allows the request) if the DB check itself errors,
 * so a rate-limiter outage can't take down the whole app; this is a defense
 * in depth measure, not the primary correctness guard against double-award.
 */
export async function checkRateLimit(key: string, windowMs = 10_000): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_window_ms: windowMs,
    });
    if (error) {
      console.error("[rate-limit] check failed, failing open:", error.message);
      return true;
    }
    return Boolean(data);
  } catch (err) {
    console.error("[rate-limit] misconfigured, failing open:", err);
    return true;
  }
}
