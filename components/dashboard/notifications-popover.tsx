"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string;
  title: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "canceled";
  updated_at: string;
};

const STATUS_VARIANT: Record<Campaign["status"], "success" | "primary" | "default" | "warning"> = {
  sent: "success",
  sending: "primary",
  scheduled: "primary",
  draft: "default",
  canceled: "warning",
};

export function NotificationsPopover({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || state !== "loading") return;
    fetch("/api/notifications/campaigns")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((body: { data: Campaign[] }) => {
        setCampaigns((body.data ?? []).filter((c) => c.status !== "draft").slice(0, 6));
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [open, state]);

  const hasActivity = state === "ready" && campaigns.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          aria-label={t("notifications")}
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="border-b border-[var(--line)] px-4 py-3">
          <p className="text-[13px] font-semibold text-[var(--ink)]">{t("notificationsTitle")}</p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {state === "loading" && (
            <div className="space-y-2 p-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          {(state === "error" || (state === "ready" && !hasActivity)) && (
            <p className="px-3 py-8 text-center text-[13px] text-[var(--muted)]">
              {t("notificationsEmpty")}
            </p>
          )}
          {hasActivity &&
            campaigns.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
              >
                <span className="truncate text-[13px] text-[var(--ink)]">{c.title}</span>
                <Badge variant={STATUS_VARIANT[c.status]} className={cn("shrink-0 capitalize")}>
                  {c.status}
                </Badge>
              </div>
            ))}
        </div>
        <div className="border-t border-[var(--line)] p-2">
          <Link
            href={`/${locale}/dashboard/notifications`}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-center text-[13px] font-medium text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
          >
            {t("notifications")}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
