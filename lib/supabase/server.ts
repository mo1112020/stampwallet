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
          // runs getUser() and persists the refreshed session cookie back to
          // the response for every path under isDashboard/isAuth/isScanApp.
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
 * server on every call (that's why it's used over getSession() — it's the
 * secure choice). That's a real network round trip, so calling it once per
 * component instead of once per request is a meaningful chunk of "why does
 * navigating the dashboard take seconds". cache() dedupes it per request.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
