"use client";

import { Bell, Info, Globe, ChevronDown } from "lucide-react";
import Link from "next/link";

export function DashboardTopbar({ locale, initial }: { locale: string; initial: string }) {
  return (
    <header className="flex h-14 items-center justify-between bg-[#1a1a1a] px-6 shrink-0">
      {/* Left side: Brand */}
      <div className="flex items-center gap-6">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-1 font-bold tracking-widest text-white text-[10px]">
          <span className="text-[#f03d52]">HIGHLIGHT</span>CARDS
        </Link>
        <div className="h-4 w-px bg-gray-700" />
        <button className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black border border-gray-600 text-white font-bold text-[10px]">
            HL
          </span>
          Ahmed
          <ChevronDown className="h-3 w-3" />
        </button>
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
