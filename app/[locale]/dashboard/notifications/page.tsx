"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { NotificationCampaign, SegmentScope } from "@/types";

const SCOPES: SegmentScope[] = ["all", "inactive_days", "birthday_month", "progress_threshold"];

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const params = useParams();
  const locale = params.locale as string;

  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<SegmentScope>("all");
  const [inactiveDays, setInactiveDays] = useState(30);
  const [minPercent, setMinPercent] = useState(80);
  const [sendType, setSendType] = useState<"manual" | "scheduled">("manual");
  const [scheduledFor, setScheduledFor] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications/campaigns");
    const json = await res.json();
    if (res.ok) setCampaigns(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    const segment: Record<string, unknown> = { scope };
    if (scope === "inactive_days") segment.inactive_days = inactiveDays;
    if (scope === "progress_threshold") segment.min_progress_percent = minPercent;

    const res = await fetch("/api/notifications/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: sendType,
        title,
        message,
        segment,
        scheduled_for: sendType === "scheduled" ? new Date(scheduledFor).toISOString() : undefined,
      }),
    });
    const json = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(json.error?.message ?? t("sendFailed"));
      return;
    }
    setTitle("");
    setMessage("");
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--primary)]">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("intro")}</p>

      <form
        onSubmit={submit}
        className="mt-6 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
      >
        <div>
          <Label htmlFor="title">{t("campaignTitle")}</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="message">{t("message")}</Label>
          <Textarea
            id="message"
            required
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="scope">{t("audience")}</Label>
          <select
            id="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as SegmentScope)}
            className="flex h-12 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-[15px] text-[var(--ink)]"
          >
            {SCOPES.map((s) => (
              <option key={s} value={s}>
                {t(`scopes.${s}`)}
              </option>
            ))}
          </select>
        </div>

        {scope === "inactive_days" && (
          <div>
            <Label htmlFor="inactiveDays">{t("inactiveDays")}</Label>
            <Input
              id="inactiveDays"
              type="number"
              min={1}
              value={inactiveDays}
              onChange={(e) => setInactiveDays(Number(e.target.value) || 1)}
            />
          </div>
        )}

        {scope === "progress_threshold" && (
          <div>
            <Label htmlFor="minPercent">{t("minPercent")}</Label>
            <Input
              id="minPercent"
              type="number"
              min={0}
              max={100}
              value={minPercent}
              onChange={(e) => setMinPercent(Number(e.target.value) || 0)}
            />
          </div>
        )}

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={sendType === "manual"}
              onChange={() => setSendType("manual")}
            />
            {t("sendNow")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={sendType === "scheduled"}
              onChange={() => setSendType("scheduled")}
            />
            {t("schedule")}
          </label>
        </div>

        {sendType === "scheduled" && (
          <div>
            <Label htmlFor="scheduledFor">{t("scheduledFor")}</Label>
            <Input
              id="scheduledFor"
              type="datetime-local"
              required
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <Button type="submit" disabled={sending}>
          {sending ? t("sending") : sendType === "manual" ? t("send") : t("scheduleButton")}
        </Button>
      </form>

      <div className="mt-8">
        <p className="text-sm font-semibold text-[var(--ink)]">{t("historyTitle")}</p>
        {loading ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("loading")}</p>
        ) : campaigns.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("noCampaigns")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {campaigns.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${locale}/dashboard/notifications/${c.id}`}
                  className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm hover:bg-[var(--surface-2)]"
                >
                  <div>
                    <p className="font-medium text-[var(--ink)]">{c.title}</p>
                    <p className="text-[var(--muted)]">
                      {c.type === "automated" ? t(`triggers.${c.trigger}`) : t(`scopes.${c.segment.scope}`)}
                      {" · "}
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                    {t(`status.${c.status}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
