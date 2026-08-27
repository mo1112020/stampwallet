import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { defaultLocale, locales } from "./i18n/config";

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

// admin.walletos.online in production, admin.localhost(:port) in dev —
// requests on this host are internally served by the locale-free app/admin
// tree (same "whole separate app root" shape as /auth/callback below, just
// host-routed instead of path-routed) and never go through next-intl.
function isAdminHost(host: string): boolean {
  return host === "admin.walletos.online" || /^admin\.localhost(:\d+)?$/.test(host);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const onAdminHost = isAdminHost(host);

  // /api and the Supabase auth routes are plain route handlers with no
  // locale segment — the intl middleware below defaults to localePrefix:
  // "always" and would otherwise redirect them to e.g. /en/auth/callback,
  // which doesn't exist and 404s before the code exchange ever runs.
  // Deliberately checked against the raw pathname regardless of host — a
  // fetch("/api/admin/...") issued from a page served on the admin host
  // must resolve to the real app/api/admin/** route handler, not gain an
  // /admin prefix.
  if (pathname.startsWith("/api") || pathname.startsWith("/auth/callback") || pathname.startsWith("/auth/confirm")) {
    return NextResponse.next();
  }

  let response: NextResponse;
  let adminPathname: string | null = null;

  if (onAdminHost) {
    // Nothing under app/admin is localized, so intl-middleware is skipped
    // entirely here — same reasoning as the /api bypass above.
    adminPathname = `/admin${pathname === "/" ? "" : pathname}`;
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = adminPathname;
    // Forwarded the same way x-locale is below -- app/admin/layout.tsx has
    // no other way to tell "this render is /admin/login" from any other
    // /admin/* route (server components don't get the pathname directly),
    // and it needs to know that to avoid redirect-looping an unauthenticated
    // visitor who is ALREADY on the login page back to the login page.
    const rewriteHeaders = new Headers(request.headers);
    rewriteHeaders.set("x-admin-pathname", adminPathname);
    response = NextResponse.rewrite(rewriteUrl, { request: { headers: rewriteHeaders } });
    // Belt-and-suspenders alongside app/admin/layout.tsx's metadata.robots --
    // the header covers responses the layout's <meta> tag can't (the login
    // page technically inherits it, but redirects and any future route
    // handler under app/api/admin/** wouldn't). robots.ts is app-root-only
    // per Next.js convention (can't be nested under app/admin), and would
    // 404 here anyway since this rewrite sends /robots.txt to
    // /admin/robots.txt, which doesn't exist -- so there's no robots.txt at
    // all on this host without this header standing in for it.
    response.headers.set("X-Robots-Tag", "noindex, nofollow, nosnippet, noarchive");
  } else {
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
    response = NextResponse.next({ request: { headers: requestHeaders } });
    intlResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  }

  const isDashboard = !onAdminHost && locales.some((l) => pathname.startsWith(`/${l}/dashboard`));
  const isAuth =
    !onAdminHost &&
    (locales.some((l) => pathname.startsWith(`/${l}/login`)) ||
      locales.some((l) => pathname.startsWith(`/${l}/signup`)));

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
  const isScanApp = !onAdminHost && locales.some((l) => pathname.startsWith(`/${l}/scan-app`));
  const isScanAppLogin = !onAdminHost && locales.some((l) => pathname.startsWith(`/${l}/scan-app/login`));

  // Platform-admin panel — same isX/isXLogin split as the Scanner PWA
  // above, just host-routed and locale-free. adminPathname (not pathname)
  // is what's compared here since onAdminHost requests were rewritten to
  // /admin/... above.
  const isAdminArea = onAdminHost;
  const isAdminLogin = onAdminHost && adminPathname === "/admin/login";

  // Every other route (marketing pages, /pass/*, etc.) doesn't gate on auth,
  // so skip the Supabase round trip entirely there — auth.getUser() is a
  // real network call to the Auth server, and doing it unconditionally on
  // every request was adding hundreds of ms (up to seconds) to pages that
  // never needed to know who the visitor is.
  if (!isDashboard && !isAuth && !isScanApp && !isAdminArea) {
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

  // getClaims() verifies the JWT locally (WebCrypto, against a cached JWKS)
  // instead of round-tripping to the Auth server the way getUser() did —
  // see lib/supabase/server.ts's getAuthUser() for the full reasoning. Only
  // truthy/falsy matters below (no field of `user` is read), so swapping
  // the shape from a User object to a claims object needed no other changes.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims ?? null;

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

  // Redirect targets are host-relative root paths ("/login", "/"), not
  // "/admin/login" — the /admin prefix is an internal rewrite detail the
  // browser never sees, and request.url still carries the real
  // admin.walletos.online host, so new URL("/login", request.url) resolves
  // to https://admin.walletos.online/login.
  if (isAdminArea && !isAdminLogin && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminLogin && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
