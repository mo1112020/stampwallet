"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { EnrollmentPageConfig, EnrollmentPageStyle } from "@/types";

type JoinPageData = {
  id: string;
  name: string;
  config: { enrollment_page?: EnrollmentPageConfig };
  merchants: { business_name: string; logo_url: string | null; brand_color_primary: string; brand_color_secondary: string } | null;
};

const copy = "Join today, collect rewards, and keep your pass in your phone wallet.";

function EnrollForm() {
  const params = useParams();
  const programId = useSearchParams().get("program") ?? "";
  const [program, setProgram] = useState<JoinPageData | null>(null);
  const [loadingPage, setLoadingPage] = useState(Boolean(programId));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passId, setPassId] = useState<string | null>(null);
  const [appleUrl, setAppleUrl] = useState<string | null>(null);
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!programId) { setLoadingPage(false); setError("This join link is incomplete."); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    fetch(`/api/programs/public/${programId}`, { signal: controller.signal }).then(async (response) => {
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message ?? "This program is unavailable.");
      setProgram(json.data);
    }).catch((reason) => setError(reason.name === "AbortError" ? "The join page took too long to load. Check that this phone can reach the app server." : reason.message)).finally(() => {
      window.clearTimeout(timeout);
      setLoadingPage(false);
    });
    const userAgent = navigator.userAgent || navigator.vendor;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [programId]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !acceptedTerms) { setError("Please complete your details and accept the terms."); return; }
    setLoading(true); setError(null);
    const response = await fetch("/api/customers/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ program_id: programId, name: name.trim(), phone: phone.trim(), email: email.trim() }) });
    const json = await response.json(); setLoading(false);
    if (!response.ok) { setError(json.error?.message ?? "Enrollment failed"); return; }
    setPassId(json.data.pass_id); setAppleUrl(json.data.apple_pass_url); setGoogleUrl(json.data.google_wallet_url);
  }

  if (loadingPage) return <main className="flex min-h-screen items-center justify-center bg-[var(--background)]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" /></main>;
  if (!program) return <main className="flex min-h-screen items-center justify-center px-6 text-center text-[var(--muted)]">{error ?? "This program is unavailable."}</main>;

  const page = program.config.enrollment_page ?? {};
  const merchant = program.merchants;
  const style: EnrollmentPageStyle = page.style ?? "classic";
  const businessName = page.business_name || merchant?.business_name || "Loyalty program";
  const programName = page.program_name || program.name;
  const logo = page.logo_url || merchant?.logo_url;
  const description = page.description || copy;
  const color = page.button_color || merchant?.brand_color_primary || "#1f57e7";
  const pageBackground = page.background_color || (page.style === "spotlight" ? color : "#f6f6f6");
  const spotlight = style === "spotlight";
  const editorial = style === "editorial";

  if (passId) return <main className="flex min-h-screen items-center justify-center px-5" style={{ backgroundColor: pageBackground }}><section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">✓</div><h1 className="mt-5 text-2xl font-bold">Your pass is ready</h1><p className="mt-2 text-sm text-[var(--muted)]">Add it to your wallet and start collecting rewards.</p><div className="mt-6 space-y-3">{isIOS && appleUrl ? <a href={appleUrl} className="block rounded-full bg-black px-5 py-3 font-semibold text-white">Add to Apple Wallet</a> : googleUrl ? <a href={googleUrl} className="block rounded-full bg-black px-5 py-3 font-semibold text-white">Add to Google Wallet</a> : null}<a href={`/${params.locale}/pass/${passId}`} className="block text-sm font-semibold" style={{ color }}>View your progress</a></div></section></main>;

  return <main className="min-h-screen px-4 py-10 sm:py-16" style={{ backgroundColor: pageBackground }}>
    <div className={`mx-auto grid w-full max-w-5xl items-center gap-10 ${editorial ? "lg:grid-cols-[1.1fr_.9fr]" : "max-w-md"}`}>
      <header className={`text-center ${editorial ? "lg:text-left" : ""} ${spotlight ? "text-white" : ""}`}>
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl ${editorial ? "lg:mx-0" : ""} ${spotlight ? "bg-white/15" : "bg-white shadow-sm"}`}>{logo ? <img src={logo} alt={`${businessName} logo`} className="h-full w-full object-cover" /> : <span className="text-2xl font-bold" style={{ color: spotlight ? "white" : color }}>{businessName.slice(0, 1)}</span>}</div>
        <p className={`text-sm font-semibold ${spotlight ? "text-white/75" : "text-[var(--muted)]"}`}>{businessName}</p>
        <h1 className={`mt-2 text-3xl font-bold tracking-tight ${editorial ? "sm:text-5xl" : ""}`}>{programName}</h1>
        <p className={`mx-auto mt-4 max-w-md text-[15px] leading-7 ${editorial ? "lg:mx-0" : ""} ${spotlight ? "text-white/85" : "text-[var(--muted)]"}`}>{description}</p>
      </header>
      <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Join the program</h2><p className="mt-1 text-sm text-[var(--muted)]">Your pass will be ready in a moment.</p>
        <div className="mt-6 space-y-4"><div><Label htmlFor="name">Your name</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="John Doe" required /></div><div><Label htmlFor="phone">Phone number</Label><Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 555 000 0000" required /></div><div><Label htmlFor="email">Email address</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div></div>
        <label className="mt-5 flex items-start gap-3 text-sm text-[var(--muted)]"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4" />I agree to receive program updates and offers.</label>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <Button type="submit" className="mt-6 h-12 w-full" style={{ backgroundColor: color }} disabled={loading}>{loading ? "Creating your pass…" : "Join & get your pass"}</Button>
      </form>
    </div>
  </main>;
}

export default function EnrollPage() { return <Suspense fallback={<main className="min-h-screen bg-[var(--background)]" />}><EnrollForm /></Suspense>; }
