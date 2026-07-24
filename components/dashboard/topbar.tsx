"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Search, ChevronDown, Sun, Moon, Monitor, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { CommandPalette } from "@/components/command-palette";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", icon: Sun, key: "themeLight" },
  { value: "dark", icon: Moon, key: "themeDark" },
  { value: "system", icon: Monitor, key: "themeSystem" },
] as const;

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
  const t = useTranslations("nav");
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("dashboard-main");
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const displayName = businessName?.trim() || "Your business";
  const badgeInitial = businessName?.trim()?.charAt(0).toUpperCase() || initial;

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-[var(--surface)]/90 px-4 backdrop-blur-md transition-[box-shadow,border-color] duration-300 md:px-6",
        scrolled
          ? "border-transparent shadow-[0_8px_24px_-16px_hsl(var(--shadow-color)/0.5)]"
          : "border-[var(--line)] shadow-none"
      )}
    >
      {/* Left: brand + breadcrumbs */}
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href={`/${locale}/dashboard`}
          className="font-brand shrink-0 text-sm text-[var(--ink)] transition-opacity hover:opacity-70"
        >
          StampWallet
        </Link>
        <div className="hidden h-4 w-px bg-[var(--line)] lg:block" />
        <Breadcrumbs locale={locale} />
      </div>

      {/* Right: search, notifications, theme, profile */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-[13px] text-[var(--muted)] transition-[border-color,color,transform] duration-200 hover:border-[var(--line-strong)] hover:text-[var(--ink)] active:scale-[0.97] sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          {t("commandPaletteHint")}
          <kbd className="ms-1 rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] sm:hidden"
          aria-label={t("commandPaletteHint")}
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>

        <NotificationsPopover locale={locale} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full py-1 pe-2 ps-1 text-[13px] text-[var(--ink)] transition-[background-color,transform] duration-200 hover:bg-[var(--surface-2)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="h-7 w-7 rounded-full border border-[var(--line)] object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-[var(--surface)]">
                  {badgeInitial}
                </span>
              )}
              <span className="hidden max-w-[10rem] truncate font-medium md:inline">{displayName}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--muted)] md:inline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/dashboard/settings`}>
                <Settings className="h-4 w-4 text-[var(--muted)]" />
                {t("settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("theme")}</DropdownMenuLabel>
            <div className="flex gap-1 px-2.5 pb-1.5">
              {THEME_OPTIONS.map(({ value, icon: Icon, key }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors",
                    theme === value
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(key)}
                </button>
              ))}
            </div>
            <DropdownMenuSeparator />
            <div className="px-1.5 pb-1">
              <LanguageSwitcher locale={locale} triggerClassName="px-2" />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={logout}>
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette locale={locale} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
