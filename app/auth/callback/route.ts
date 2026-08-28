import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Only same-origin absolute paths are allowed as a post-login destination.
 * A bare `.startsWith("/")` check still lets `//evil.com` (protocol-relative)
 * and `/\evil.com` through as an open redirect. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/en/dashboard";
  }
  return next;
}

/** OAuth (Google/Apple) sign-in only — signInWithOAuth's redirect always
 * completes on the same browser that started it, so the PKCE code_verifier
 * cookie this exchange needs is guaranteed to be present *as long as the
 * flow starts and ends on the same host* (see lib/auth/oauth-redirect.ts —
 * redirectTo is pinned to NEXT_PUBLIC_APP_URL for exactly that reason).
 * Email-token flows (recovery/signup/invite) go through app/auth/confirm
 * instead, since those links are routinely opened on a different device. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  // Bounce auth failures back to the login page in the same locale the flow
  // started in, not a hardcoded /en.
  const locale = next.split("/")[1] || "en";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
  } else {
    console.error("[auth/callback] no `code` in callback URL");
  }

  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
}
