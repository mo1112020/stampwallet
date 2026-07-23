"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { dashboardNavLinks } from "@/lib/nav-links";
import { cn } from "@/lib/utils";

type CommandPaletteProps = {
  locale: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CommandPalette({ locale, open: openProp, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const router = useRouter();
  const t = useTranslations("nav");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  function go(href: string) {
    setOpen(false);
    router.push(`/${locale}/${href}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showClose={false}
        className="top-[20%] max-w-lg translate-y-0 overflow-hidden p-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{t("commandPaletteLabel")}</DialogTitle>
        <Command
          label={t("commandPaletteLabel")}
          className="flex flex-col"
          // cmdk renders its own DialogTitle-less content; the visible title lives in the input below.
        >
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4">
            <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <Command.Input
              autoFocus
              placeholder={t("commandPalettePlaceholder")}
              className="h-12 w-full bg-transparent text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-[13px] text-[var(--muted)]">
              {t("commandPaletteEmpty")}
            </Command.Empty>
            <Command.Group
              heading={t("commandPaletteGroup")}
              className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] [&_[cmdk-group-items]]:mt-1.5"
            >
              {dashboardNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Command.Item
                    key={link.href}
                    value={t(link.key)}
                    onSelect={() => go(link.href)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium text-[var(--ink)]",
                      "data-[selected=true]:bg-[var(--surface-2)]"
                    )}
                  >
                    <Icon className="h-4 w-4 text-[var(--muted)]" />
                    {t(link.key)}
                  </Command.Item>
                );
              })}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
