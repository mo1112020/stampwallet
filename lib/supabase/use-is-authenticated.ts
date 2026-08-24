"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-only auth signal for the marketing site.
 *
 * Marketing pages are statically prerendered (generateStaticParams +
 * setRequestLocale in app/[locale]/layout.tsx, per next-intl's static
 * rendering pattern), and proxy.ts deliberately skips the Supabase session
 * round trip for every route outside dashboard/auth/scan-app to keep them
 * fast (see the isDashboard/isAuth/isScanApp check there). That means
 * there's no server-known session to hand these pages as a prop at
 * request time — fetching one in a marketing layout/page would get baked
 * into the static HTML at build time and either always read "logged out"
 * or, worse, leak whatever session happened to exist at build time to
 * every visitor. This hook is the client-only way to answer "does this
 * visitor look logged in" for UI purposes (e.g. swapping Login/Sign up for
 * a Dashboard link in the marketing header/footer) without gating
 * anything — real access control still happens server-side in proxy.ts and
 * the dashboard layout (app/[locale]/dashboard/layout.tsx).
 *
 * Starts `false` (matches the static/SSR HTML, so there's no hydration
 * mismatch) and flips to `true` once the browser-side check resolves.
 * Uses getSession() rather than getUser() on purpose: it's a local read
 * (cookies via @supabase/ssr), not a network round trip to the Auth
 * server, so the window where a logged-in visitor still sees the logged-
 * out CTA is as short as possible. Being slightly stale is fine here since
 * this only ever changes which link/label is shown, never what's
 * accessible.
 */
export function useIsAuthenticated(): boolean {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setIsAuthenticated(!!session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return isAuthenticated;
}
