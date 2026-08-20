/** Client-side pre-flight throttle check for login/signup/password-reset —
 * see app/api/auth/rate-limit-check/route.ts for what it actually enforces
 * and why it exists as a separate call rather than wrapping the Supabase
 * auth call itself (that call goes straight from the browser to Supabase,
 * never through this app's server). Fails open on a network hiccup
 * checking the throttle — that must never itself block a legitimate
 * attempt, same default lib/rate-limit.ts's checkRateLimit uses. */
export async function checkAuthRateLimit(action: "login" | "signup" | "password_reset"): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/rate-limit-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    return res.ok;
  } catch {
    return true;
  }
}
