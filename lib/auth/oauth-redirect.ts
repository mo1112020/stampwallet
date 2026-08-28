/**
 * Canonical origin for the OAuth (Google/Apple) `redirectTo`.
 *
 * `supabase.auth.signInWithOAuth` used to be handed `window.location.origin`,
 * which is whatever host the browser happens to be on — `walletos.online`,
 * `www.walletos.online`, a Vercel preview URL, `localhost`, etc. Only ONE of
 * those is registered in the Supabase Auth "Redirect URLs" allowlist
 * (`{NEXT_PUBLIC_APP_URL}/auth/callback`, per .env.example). When the value
 * doesn't match, Supabase silently drops it and falls back to the project's
 * Site URL, so the post-consent redirect lands on a different host than the
 * one that started the flow. The PKCE `code-verifier` cookie the browser
 * client set is host-scoped (no explicit Domain), so it isn't sent to that
 * other host, `exchangeCodeForSession` in app/auth/callback fails, and the
 * user is bounced back to /login — the "clicked Google, waited, ended up back
 * at login, tried again" round-trip that reads as a 20s+ login on production
 * (the apex↔www 308 redirect makes the host swap happen even mid-flow).
 *
 * Pinning it to NEXT_PUBLIC_APP_URL — the same "this deployment's own public
 * URL" convention used for metadataBase, sitemap, wallet callbacks, etc. —
 * makes the flow start and end on the one host Supabase is configured for.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_APP_URL (set per-environment; preview/prod)
 *   2. the production canonical host — the apex `walletos.online` permanently
 *      308-redirects to `www`, so a bare-apex fallback would itself trigger
 *      the mid-flow host swap this helper exists to prevent
 *   3. window.location.origin — local dev, where 1 and 2 don't apply
 */
const CANONICAL_HOST = "https://www.walletos.online";

export function oauthOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? window.location.origin
      : CANONICAL_HOST;
  }
  return CANONICAL_HOST;
}
