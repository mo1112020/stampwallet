"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send, Clock, Search, X } from "lucide-react";
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

const SCOPES: SegmentScope[] = ["all", "program", "inactive_days", "birthday_month", "progress_threshold", "customers"];
const TITLE_MAX = 100;
const MESSAGE_MAX = 500;
const CUSTOMER_SEARCH_DEBOUNCE_MS = 300;

type PickableCustomer = { id: string; name: string | null; phone: string | null; email: string | null };

/** Search-and-pick list for scope: "customers" — lets a merchant target an
 * exact, hand-picked set of customers (any number) instead of only a
 * rule-based segment. Reuses the same /api/customers search the Customers
 * page uses, so results match exactly what the merchant sees there. */
function CustomerPicker({
  selected,
  onChange,
}: {
  selected: PickableCustomer[];
  onChange: (next: PickableCustomer[]) => void;
}) {
  const t = useTranslations("notifications");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickableCustomer[]>([]);
  const [searching, setSearching] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const id = ++requestIdRef.current;
    setSearching(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/customers?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((json) => {
          if (id !== requestIdRef.current) return;
          setResults(json.data?.customers ?? []);
        })
        .finally(() => {
          if (id === requestIdRef.current) setSearching(false);
        });
    }, CUSTOMER_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const selectedIds = new Set(selected.map((c) => c.id));

  function add(customer: PickableCustomer) {
    if (selectedIds.has(customer.id)) return;
    onChange([...selected, customer]);
    setQuery("");
    setResults([]);
  }

  function remove(id: string) {
    onChange(selected.filter((c) => c.id !== id));
  }

  return (
    <div>
      <Label htmlFor="customerSearch">{t("searchCustomers")}</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          id="customerSearch"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchCustomers")}
          className="ps-9"
        />
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">{t("searchCustomersHint")}</p>

      {query.trim() && (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-[var(--line)]">
          {searching ? (
            <p className="p-3 text-sm text-[var(--muted)]">{t("loading")}</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-[var(--muted)]">{t("noCustomersFound")}</p>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => add(c)}
                disabled={selectedIds.has(c.id)}
                className="flex w-full items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2.5 text-start text-sm transition-colors last:border-b-0 hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-[var(--ink)]">{c.name || t("unknownCustomer")}</span>
                  <span className="block truncate text-xs text-[var(--muted)]">{c.phone || c.email || ""}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {t("selectedCustomers")} · {selected.length}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selected.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] py-1 ps-3 pe-1.5 text-xs font-medium text-[var(--ink)]"
              >
                {c.name || c.phone || c.email || t("unknownCustomer")}
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={t("removeCustomer")}
                  className="rounded-full p-0.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--ink)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_VARIANT: Record<NotificationCampaignStatus, "success" | "primary" | "default" | "warning" | "danger"> = {
  sent: "success",
  sending: "primary",
  scheduled: "primary",
  draft: "default",
  failed: "danger",
  canceled: "warning",
};

export function NotificationsContent({
  locale,
  campaigns,
  programs,
  merchant,
}: {
  locale: string;
  campaigns: NotificationCampaign[];
  programs: { id: string; name: string }[];
  merchant: { business_name: string; logo_url: string | null };
}) {
  const t = useTranslations("notifications");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<SegmentScope>("all");
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [inactiveDays, setInactiveDays] = useState(30);
  const [minPercent, setMinPercent] = useState(80);
  const [selectedCustomers, setSelectedCustomers] = useState<PickableCustomer[]>([]);
  // Empty = notify every program the picked customer(s) are enrolled in
  // (the original behavior) — set = only their card for that one program,
  // so picking a customer who happens to hold more than one of this
  // merchant's cards doesn't fan out to all of them by default.
  const [customerProgramFilter, setCustomerProgramFilter] = useState("");
  const [sendType, setSendType] = useState<"manual" | "scheduled">("manual");
  const [scheduledFor, setScheduledFor] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep campaign history's status badges live (e.g. "Sending" -> "Sent")
  // without a manual reload — only polls while something is actually
  // in flight, not on every visit to the page.
  const hasInFlightCampaign = campaigns.some((c) => c.status === "sending");
  useEffect(() => {
    if (!hasInFlightCampaign) return;
    const interval = window.setInterval(() => router.refresh(), 3000);
    return () => window.clearInterval(interval);
  }, [hasInFlightCampaign, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (scope === "customers" && selectedCustomers.length === 0) {
      setError(t("selectAtLeastOneCustomer"));
      return;
    }
    setSending(true);
    setError(null);

    const segment: Record<string, unknown> = { scope };
    if (scope === "program") segment.program_id = programId;
    if (scope === "inactive_days") segment.inactive_days = inactiveDays;
    if (scope === "progress_threshold") segment.min_progress_percent = minPercent;
    if (scope === "customers") {
      segment.customer_ids = selectedCustomers.map((c) => c.id);
      if (customerProgramFilter) segment.program_id = customerProgramFilter;
    }

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
    setSelectedCustomers([]);
    setCustomerProgramFilter("");
    toast.success(sendType === "manual" ? t("send") : t("scheduleButton"));
    router.refresh();
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

            {scope === "customers" && (
              <>
                <CustomerPicker selected={selectedCustomers} onChange={setSelectedCustomers} />
                {programs.length > 0 && (
                  <div>
                    <Label htmlFor="customerProgramFilter">{t("limitToProgram")}</Label>
                    <Select
                      id="customerProgramFilter"
                      value={customerProgramFilter}
                      onChange={(e) => setCustomerProgramFilter(e.target.value)}
                    >
                      <option value="">{t("allTheirPrograms")}</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-1 text-xs text-[var(--muted)]">{t("limitToProgramHint")}</p>
                  </div>
                )}
              </>
            )}

            <div>
              <Label>{t("sendNow")}</Label>
              <div className="flex w-full max-w-sm rounded-full bg-[var(--surface-2)] p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setSendType("manual")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 transition-[background-color,color,box-shadow] duration-150",
                    sendType === "manual" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
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
                    sendType === "scheduled" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"
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
          <MessagePreview title={title} message={message} businessName={merchant.business_name ?? ""} logoUrl={merchant.logo_url} />
        </div>
      </div>

      <div className="mt-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{t("historyTitle")}</p>
        {campaigns.length === 0 ? (
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
