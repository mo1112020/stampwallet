import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { defaultLocale, locales } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api and the Supabase auth routes are plain route handlers with no
  // locale segment — the intl middleware below defaults to localePrefix:
  // "always" and would otherwise redirect them to e.g. /en/auth/callback,
  // which doesn't exist and 404s before the code exchange ever runs.
  if (pathname.startsWith("/api") || pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/confirm")) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);
  if (intlResponse.headers.get("location")) {
    // next-intl is redirecting to add/normalize the locale prefix — follow
    // it as-is; the redirected request re-enters this middleware fresh.
    return intlResponse;
  }

  // not-found.tsx files don't receive `params`, so this is how they read
  // the URL's locale segment via headers() — see app/not-found.tsx and
  // app/[locale]/not-found.tsx, which need it for genuinely unmatched
  // routes (Next.js renders the root not-found boundary for those, not
  // the nested one, regardless of the locale segment matching).
  const firstSegment = pathname.split("/")[1];
  const urlLocale = (locales as readonly string[]).includes(firstSegment) ? firstSegment : defaultLocale;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", urlLocale);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  intlResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));

  const isDashboard = locales.some((l) => pathname.startsWith(`/${l}/dashboard`));
  const isAuth =
    locales.some((l) => pathname.startsWith(`/${l}/login`)) ||
    locales.some((l) => pathname.startsWith(`/${l}/signup`));

  // The Scanner PWA (staff-facing, separate login from the merchant
  // dashboard) used to be entirely outside this check, so its sessions
  // never got the getUser()-triggered refresh below, and a refreshed
  // access-token cookie had no path back to the browser (server components
  // can read cookies but can't reliably write them — see the comment in
  // lib/supabase/server.ts). That's the same session-refresh gap dashboard
  // auth relies on this file to close, just left open for one whole app
  // area. isScanAppLogin is carved out of isScanApp so the login page
  // itself doesn't get treated as "needs a session" (it doesn't have one
  // yet) while still getting the getUser() round trip that lets an
  // already-authenticated staff member bounce straight to /scan-app.
  const isScanApp = locales.some((l) => pathname.startsWith(`/${l}/scan-app`));
  const isScanAppLogin = locales.some((l) => pathname.startsWith(`/${l}/scan-app/login`));

  // Every other route (marketing pages, /pass/*, etc.) doesn't gate on auth,
  // so skip the Supabase round trip entirely there — auth.getUser() is a
  // real network call to the Auth server, and doing it unconditionally on
  // every request was adding hundreds of ms (up to seconds) to pages that
  // never needed to know who the visitor is.
  if (!isDashboard && !isAuth && !isScanApp) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "public-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isDashboard && !user) {
    const locale = pathname.split("/")[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (isAuth && user) {
    const locale = pathname.split("/")[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  if (isScanApp && !isScanAppLogin && !user) {
    const locale = pathname.split("/")[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/scan-app/login`, request.url));
  }

  if (isScanAppLogin && user) {
    const locale = pathname.split("/")[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/scan-app`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
