import { headers } from "next/headers";
import { getPlatformAdminOrNull } from "@/lib/auth/platform-admin";
import { redirect } from "next/navigation";
import { AdminMfaEnroll } from "@/components/admin/admin-mfa-enroll";
import { AdminMfaChallenge } from "@/components/admin/admin-mfa-challenge";

export const metadata = {
  title: "WalletOS Admin",
  robots: { index: false, follow: false },
};

// Forces the dark "console" identity everywhere under /admin regardless of
// the visitor's own light/dark site preference -- deliberately distinct
// from the merchant-facing login and dashboard, which this panel should
// never be mistaken for. .dark is a plain CSS-variable scope (see
// app/globals.css), not tied to next-themes' <html> class, so nesting it
// here doesn't affect (or get affected by) the rest of the site.
function AdminShell({ children }: { children: React.ReactNode }) {
  return <div className="dark min-h-screen bg-[var(--background)] text-[var(--ink)]">{children}</div>;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Set by proxy.ts's host-rewrite -- the only way this server component
  // can tell "this render IS /admin/login" from any other /admin/* route.
  // Without this exemption, an unauthenticated visitor on the login page
  // itself would hit the no_session branch below and get redirected to
  // /login -- the exact page already being served -- an infinite loop.
  // proxy.ts already keeps any already-authenticated session away from this
  // path (isAdminLogin && user -> redirect to "/"), so by the time this
  // runs for /admin/login there's nothing left to gate.
  const h = await headers();
  if (h.get("x-admin-pathname") === "/admin/login") {
    return <AdminShell>{children}</AdminShell>;
  }

  const result = await getPlatformAdminOrNull();

  // No session at all -- nothing to show, send them to sign in. A session
  // that just isn't allowlisted (status "forbidden") is handled below
  // instead of redirected -- redirecting to /login would immediately hit
  // proxy.ts's isAdminLogin branch (they ARE logged in) and bounce straight
  // back here, an infinite loop between two pages that both see the same
  // authenticated-but-unauthorized user.
  if (result.status === "no_session") {
    redirect("/login");
  }

  if (result.status === "forbidden") {
    return (
      <AdminShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
            <h1 className="text-lg font-semibold text-[var(--ink)]">Not authorized</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {result.email} isn&apos;t on the admin allowlist for this panel.
            </p>
          </div>
        </div>
      </AdminShell>
    );
  }

  // Allowlisted, but this session hasn't reached aal2 yet -- the only
  // cross-tenant surface in the app, so a password alone isn't enough here
  // (see lib/auth/platform-admin.ts). Rendered inline, not redirected, for
  // the same loop-avoidance reason as "forbidden" above.
  if (result.status === "mfa_enroll_required") {
    return (
      <AdminShell>
        <AdminMfaEnroll />
      </AdminShell>
    );
  }

  if (result.status === "mfa_challenge_required") {
    return (
      <AdminShell>
        <AdminMfaChallenge />
      </AdminShell>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
