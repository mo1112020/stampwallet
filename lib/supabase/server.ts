import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function publicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  );
}

/**
 * cache()'d so every Server Component in a single request tree (layout +
 * page + any nested component) shares one client instance instead of each
 * re-reading cookies() and constructing its own. Combined with
 * getAuthUser() below, this is what stops a single dashboard navigation
 * from firing off several redundant Supabase Auth round trips.
 */
export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component, which can't write cookies on its
          // own — proxy.ts (Next.js 16's renamed middleware; see
          // node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md)
          // runs getClaims() and persists the refreshed session cookie back
          // to the response for every path under isDashboard/isAuth/isScanApp.
          // Routes outside that set skip the Supabase round trip entirely
          // and won't get a session refresh here either — that's fine for
          // logged-out marketing/public pages, but any new authenticated
          // route needs to be added to proxy.ts's matcher logic, or its
          // sessions will silently never refresh.
        }
      },
    },
  });
});

/**
 * `supabase.auth.getUser()` re-validates the JWT against the Supabase Auth
 * server on every single call — a real network round trip, and doing that
 * once per component (even cache()'d per request) instead of once per
 * *navigation* was a meaningful chunk of "why does the dashboard take
 * seconds to load". This project's Auth server uses an asymmetric (ES256)
 * signing key (see /.well-known/jwks.json), which is exactly the case
 * `getClaims()` is for: it verifies the JWT's signature locally via the
 * WebCrypto API against a module-cached JWKS instead of asking the Auth
 * server to do it, so in the common case (JWKS already cached, token not
 * near expiry) this resolves with zero network calls instead of one. It
 * still transparently refreshes-and-persists an expiring session the same
 * way getUser() did (see the cookie `setAll` catch above), and it's just as
 * trustworthy as getUser() — unlike getSession(), which returns whatever
 * the cookie says without verifying it was actually signed by Supabase.
 * Only `sub`/`email` are pulled out here because that's all any call site
 * in this codebase reads off the old User object.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return null;
  return { id: data.claims.sub, email: data.claims.email };
});
