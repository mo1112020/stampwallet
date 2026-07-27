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
          // Called from a Server Component — middleware will refresh sessions.
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
