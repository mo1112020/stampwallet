"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { toast } from "@/components/ui/toaster";
import { MessagePreview } from "@/components/dashboard/notifications/message-preview";
import { cn } from "@/lib/utils";
import type { NotificationCampaign, NotificationCampaignStatus, SegmentScope } from "@/types";

const SCOPES: SegmentScope[] = ["all", "program", "inactive_days", "birthday_month", "progress_threshold"];
const TITLE_MAX = 100;
const MESSAGE_MAX = 500;

const STATUS_VARIANT: Record<NotificationCampaignStatus, "success" | "primary" | "default" | "warning"> = {
  sent: "success",
  sending: "primary",
  scheduled: "primary",
  draft: "default",
  canceled: "warning",
};

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const params = useParams();
  const locale = params.locale as string;

  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [merchant, setMerchant] = useState<{ business_name: string; logo_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<SegmentScope>("all");
  const [programId, setProgramId] = useState("");
  const [inactiveDays, setInactiveDays] = useState(30);
  const [minPercent, setMinPercent] = useState(80);
  const [sendType, setSendType] = useState<"manual" | "scheduled">("manual");
  const [scheduledFor, setScheduledFor] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [campaignsRes, programsRes, merchantRes] = await Promise.all([
      fetch("/api/notifications/campaigns"),
      fetch("/api/programs"),
      fetch("/api/merchants/me"),
    ]);
    const campaignsJson = await campaignsRes.json();
    if (campaignsRes.ok) setCampaigns(campaignsJson.data ?? []);
    const programsJson = await programsRes.json();
    if (programsRes.ok) {
      const list = (programsJson.data ?? []) as { id: string; name: string }[];
      setPrograms(list);
      setProgramId((current) => current || list[0]?.id || "");
    }
    const merchantJson = await merchantRes.json();
    if (merchantRes.ok) setMerchant(merchantJson.data ?? null);
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
    if (scope === "program") segment.program_id = programId;
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
      const msg = json.error?.message ?? t("sendFailed");
      setError(msg);
      toast.error(msg);
      return;
    }
    setTitle("");
    setMessage("");
    toast.success(sendType === "manual" ? t("send") : t("scheduleButton"));
    load();
  }

  return (
    <div className="max-w-6xl">
      <Reveal as="div">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{t("intro")}</p>
      </Reveal>

      <div className="mt-8 flex flex-col-reverse gap-8 lg:flex-row lg:items-start">
        <form onSubmit={submit} className="flex-1 space-y-5">
          <Card className="space-y-5 p-6">
            <div>
              <Label htmlFor="title">{t("campaignTitle")}</Label>
              <Input id="title" required maxLength={TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} />
              <p className="mt-1 text-end text-xs text-[var(--muted)]">
                {title.length} / {TITLE_MAX}
              </p>
            </div>

            <div>
              <Label htmlFor="message">{t("message")}</Label>
              <Textarea id="message" required maxLength={MESSAGE_MAX} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              <p className="mt-1 text-end text-xs text-[var(--muted)]">
                {message.length} / {MESSAGE_MAX}
              </p>
            </div>

            <div>
              <Label htmlFor="scope">{t("audience")}</Label>
              <Select id="scope" value={scope} onChange={(e) => setScope(e.target.value as SegmentScope)}>
                {SCOPES.map((s) => (
                  <option key={s} value={s}>
                    {t(`scopes.${s}`)}
                  </option>
                ))}
              </Select>
            </div>

            {scope === "program" && (
              <div>
                <Label htmlFor="programId">{t("program")}</Label>
                {programs.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">{t("noPrograms")}</p>
                ) : (
                  <Select id="programId" required value={programId} onChange={(e) => setProgramId(e.target.value)}>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}

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

            <div>
              <Label>{t("sendNow")}</Label>
              <div className="flex w-full max-w-sm rounded-full bg-[var(--surface-2)] p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setSendType("manual")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-[background-color,color,box-shadow] duration-150",
                    sendType === "manual" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"
                  )}
                >
                  <Send className="h-3.5 w-3.5" />
                  {t("sendNow")}
                </button>
                <button
                  type="button"
                  onClick={() => setSendType("scheduled")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-[background-color,color,box-shadow] duration-150",
                    sendType === "scheduled" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {t("schedule")}
                </button>
              </div>
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
            <Button type="submit" disabled={sending} className="w-full sm:w-auto">
              {sending ? t("sending") : sendType === "manual" ? t("send") : t("scheduleButton")}
            </Button>
          </Card>
        </form>

        <div className="w-full shrink-0 lg:sticky lg:top-8 lg:w-[300px]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{t("preview")}</p>
          <MessagePreview title={title} message={message} businessName={merchant?.business_name ?? ""} logoUrl={merchant?.logo_url} />
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{t("historyTitle")}</p>
        {loading ? (
          <p className="mt-3 text-sm text-[var(--muted)]">{t("loading")}</p>
        ) : campaigns.length === 0 ? (
          <Card className="mt-3">
            <CardContent className="pt-5 text-sm text-[var(--muted)]">{t("noCampaigns")}</CardContent>
          </Card>
        ) : (
          <StaggerGroup className="mt-3 space-y-2">
            {campaigns.map((c) => (
              <Link key={c.id} href={`/${locale}/dashboard/notifications/${c.id}`}>
                <Card className="flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-2)]">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--ink)]">{c.title}</p>
                    <p className="text-[var(--muted)]">
                      {c.type === "automated" ? t(`triggers.${c.trigger}`) : t(`scopes.${c.segment.scope}`)}
                      {" · "}
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[c.status]} className="shrink-0 capitalize">
                    {t(`status.${c.status}`)}
                  </Badge>
                </Card>
              </Link>
            ))}
          </StaggerGroup>
        )}
      </div>
    </div>
  );
}
