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

  // /api and the Supabase OAuth callback are plain route handlers with no
  // locale segment — the intl middleware below defaults to localePrefix:
  // "always" and would otherwise redirect them to e.g. /en/auth/callback,
  // which doesn't exist and 404s before the code exchange ever runs.
  if (pathname.startsWith("/api") || pathname.startsWith("/auth/callback")) {
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

  // Every other route (marketing pages, /pass/*, etc.) doesn't gate on auth,
  // so skip the Supabase round trip entirely there — auth.getUser() is a
  // real network call to the Auth server, and doing it unconditionally on
  // every request was adding hundreds of ms (up to seconds) to pages that
  // never needed to know who the visitor is.
  if (!isDashboard && !isAuth) {
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

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
