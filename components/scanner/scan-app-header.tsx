"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { StaffRole } from "@/types";

export function ScanAppHeader({
  locale,
  businessName,
  role,
}: {
  locale: string;
  businessName: string;
  role: StaffRole;
}) {
  const router = useRouter();
  const t = useTranslations("scanner");
  const tNav = useTranslations("nav");

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/scan-app/login`);
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="font-brand text-sm text-white">{businessName || "StampWallet"}</p>
        <p className="text-xs uppercase tracking-wide text-white/50">{t(`role.${role}`)}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
      >
        {tNav("logout")}
      </button>
    </header>
  );
}
