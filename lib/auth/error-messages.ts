/**
 * Maps raw Supabase auth-js error strings to a translation key from the
 * "auth" namespace. Falls back to the original message when nothing matches
 * — better an accurate raw message than a wrong friendly one.
 */
export function mapAuthErrorKey(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "invalidCredentials";
  if (m.includes("email not confirmed")) return "emailNotConfirmed";
  if (m.includes("already registered") || m.includes("already exists")) return "userExists";
  if (m.includes("rate limit") || m.includes("security purposes")) return "rateLimited";
  return null;
}
