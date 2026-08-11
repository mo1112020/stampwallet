import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Verifies the token_hash from our own branded auth emails (recovery,
 * signup, invite — see app/api/auth/email-hook) directly via Supabase's
 * verifyOtp, instead of bouncing through Supabase's own /auth/v1/verify
 * and back to /auth/callback for a PKCE code exchange.
 *
 * That code-exchange path requires the code_verifier cookie set on the
 * browser that INITIATED the request — which breaks for exactly the case
 * these links exist for: requesting a reset on desktop and opening the
 * email on a phone. verifyOtp validates the token itself, so it works
 * from any device.
 */
/** `next` arrives as a full absolute URL (forgot-password/page.tsx and the
 * team invite route both build redirectTo as `${origin}/${locale}/...`),
 * not a bare path — resolve it against `base` and keep only same-origin
 * path+search, rather than blindly prefixing it onto our own origin. */
function resolveNext(next: string, base: string): string {
  try {
    const url = new URL(next, base);
    return `${url.pathname}${url.search}`;
  } catch {
    return "/en/dashboard";
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = resolveNext(searchParams.get("next") ?? "/en/dashboard", origin);

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/en/login?error=auth`);
}
