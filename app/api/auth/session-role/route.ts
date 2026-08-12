import { jsonOk, requireSession } from "@/lib/api";

/**
 * Tells the caller which role the *current* session resolves to — used by
 * app/[locale]/reset-password/page.tsx right after a first-time invite (or a
 * password reset) to decide where to land the user. Owners/admins/managers
 * belong in /dashboard; "staff" only has the scan capability there (see
 * lib/auth/permissions.ts) and is meant to use the separate scan-app PWA
 * instead, which is also where the "install to your phone" prompt lives —
 * hardcoding every post-password-set redirect to /dashboard meant a newly
 * invited staff member never reached that page at all.
 */
export async function GET() {
  const session = await requireSession();
  if ("error" in session) return session.error;

  return jsonOk({ role: session.role });
}
