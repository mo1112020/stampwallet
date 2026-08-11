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
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/en/dashboard";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
    }
  }

  return NextResponse.redirect(`${origin}/en/login?error=auth`);
}
