"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type EnrollData = { factorId: string; qrCode: string; secret: string };

export function AdminMfaEnroll() {
  const router = useRouter();
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();

      // A reloaded/abandoned enroll attempt leaves an unverified factor
      // behind -- clear those first so this doesn't accumulate orphaned
      // factors every time the enroll screen is visited. Unverified factors
      // only show up in `all` -- the per-type arrays (`.totp`) only ever
      // contain verified ones.
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const staleUnverified = (factorsData?.all ?? []).filter(
        (f) => f.factor_type === "totp" && f.status === "unverified"
      );
      for (const factor of staleUnverified) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrollErr || !data) {
        setError(enrollErr?.message ?? "Could not start MFA enrollment");
        return;
      }
      setEnrollData({ factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret });
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollData) return;
    setVerifying(true);
    setError(null);

    const supabase = createClient();
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId: enrollData.factorId,
    });
    if (challengeErr || !challenge) {
      setVerifying(false);
      setError(challengeErr?.message ?? "Could not start verification");
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: enrollData.factorId,
      challengeId: challenge.id,
      code,
    });
    setVerifying(false);
    if (verifyErr) {
      setError(verifyErr.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold text-[var(--ink)]">Set up two-factor authentication</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This panel has full access to every merchant&apos;s billing data, so a password alone isn&apos;t enough.
          Scan this with an authenticator app (Google Authenticator, 1Password, Authy) and enter the 6-digit code.
        </p>

        {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

        {!enrollData ? (
          <div className="mt-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
          </div>
        ) : (
          <>
            <div
              className="mx-auto mt-4 w-full max-w-[220px]"
              // Supabase returns this as raw SVG markup -- its own documented
              // rendering pattern, no image request involved.
              dangerouslySetInnerHTML={{ __html: enrollData.qrCode }}
            />
            <p className="mt-2 break-all text-center text-xs text-[var(--muted)]">
              Can&apos;t scan? Enter manually: <span className="font-mono">{enrollData.secret}</span>
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="mfa-code">6-digit code</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button type="submit" disabled={verifying || code.length !== 6} className="w-full">
                {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm and enable
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
