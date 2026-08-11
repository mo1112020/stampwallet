import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** OAuth (Google/Apple) sign-in only — signInWithOAuth's redirect always
 * completes on the same browser that started it, so the PKCE code_verifier
 * cookie this exchange needs is guaranteed to be present. Email-token
 * flows (recovery/signup/invite) go through app/auth/confirm instead,
 * since those links are routinely opened on a different device. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/en/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
    }
  }

  return NextResponse.redirect(`${origin}/en/login?error=auth`);
}
