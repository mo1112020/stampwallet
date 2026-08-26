"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit-check";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setError(null);
    // Same pre-flight throttle app/[locale]/login uses -- this panel shares
    // the same Supabase Auth call (signInWithPassword goes straight from the
    // browser to Supabase, not through this app's server), so it needs the
    // same app-level abuse guard against credential stuffing. Keyed by
    // action="login" + IP in lib/rate-limit.ts, shared with the merchant
    // login form -- deliberately not a separate, looser budget for admin.
    if (!(await checkAuthRateLimit("login"))) {
      setLoading(null);
      setError("Too many attempts. Please wait a moment and try again.");
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(null);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function onGoogle() {
    setLoading("google");
    setError(null);
    const supabase = createClient();
    // origin here is admin.walletos.online (this button only renders on
    // this host) -- next=/ resolves back to this same host's root, never
    // the merchant dashboard, via app/auth/callback's origin-relative
    // redirect.
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    if (err) {
      setLoading(null);
      setError(err.message);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          <ShieldAlert className="h-3.5 w-3.5 text-[var(--primary)]" />
          Restricted access
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-7">
          <h1 className="font-mono text-lg font-bold uppercase tracking-tight text-[var(--ink)]">
            WalletOS <span className="text-[var(--primary)]">/ Admin</span>
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted)]">Platform operator console. Not for merchant accounts.</p>

          <button
            type="button"
            disabled={loading !== null}
            onClick={onGoogle}
            className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface-2)] text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-3)] disabled:opacity-50"
          >
            {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--line)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">or</span>
            <div className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className="rounded-md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <Button type="submit" disabled={loading !== null} className="w-full rounded-md">
              {loading === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
