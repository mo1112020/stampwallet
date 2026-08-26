"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AdminMfaChallenge() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: listErr } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp[0];
      if (listErr || !verified) {
        setError(listErr?.message ?? "No verified authenticator found");
        return;
      }
      setFactorId(verified.id);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setVerifying(true);
    setError(null);

    const supabase = createClient();
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr || !challenge) {
      setVerifying(false);
      setError(challengeErr?.message ?? "Could not start verification");
      return;
    }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
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
        <h1 className="text-lg font-semibold text-[var(--ink)]">Enter your authenticator code</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Two-factor verification is required every session for this panel.
        </p>

        {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="mfa-code">6-digit code</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <Button type="submit" disabled={verifying || !factorId || code.length !== 6} className="w-full">
            {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </form>
      </Card>
    </div>
  );
}
