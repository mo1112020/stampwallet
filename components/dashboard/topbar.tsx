"use client";

import { Bell, Info, ChevronDown } from "lucide-react";
import Link from "next/link";

export function DashboardTopbar({
  locale,
  initial,
  businessName,
  logoUrl,
}: {
  locale: string;
  initial: string;
  businessName: string | null;
  logoUrl: string | null;
}) {
  const displayName = businessName?.trim() || "Your business";
  const badgeInitial = businessName?.trim()?.charAt(0).toUpperCase() || initial;

  return (
    <header className="flex h-14 items-center justify-between bg-[#1a1a1a] px-6 shrink-0">
      {/* Left side: Brand */}
      <div className="flex items-center gap-6">
        <Link href={`/${locale}/dashboard`} className="font-brand shrink-0 text-sm text-white">
          StampWallet
        </Link>
        <div className="h-4 w-px bg-gray-700" />
        <Link
          href={`/${locale}/dashboard/settings`}
          className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={displayName}
              className="h-6 w-6 rounded-full object-cover border border-gray-600"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black border border-gray-600 text-white font-bold text-[10px]">
              {badgeInitial}
            </span>
          )}
          {displayName}
          <ChevronDown className="h-3 w-3" />
        </Link>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-4 text-gray-400">
        <button className="hover:text-white transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <button className="hover:text-white transition-colors">
          <Info className="h-5 w-5" />
        </button>
        <button className="hover:text-white transition-colors flex items-center justify-center h-5 w-5 rounded-full border border-gray-400 text-[10px] uppercase">
          {locale}
        </button>
        <button className="hover:text-white transition-colors ml-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-600 text-xs font-semibold text-white">
            {initial}
          </div>
        </button>
      </div>
    </header>
  );
}
