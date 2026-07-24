"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NotificationCampaign, NotificationCampaignStatus, NotificationSend } from "@/types";

const STATUS_VARIANT: Record<NotificationCampaignStatus, "success" | "primary" | "default" | "warning"> = {
  sent: "success",
  sending: "primary",
  scheduled: "primary",
  draft: "default",
  canceled: "warning",
};

type SendWithCustomer = NotificationSend & {
  customer_progress: { customers: { name: string | null } | null } | null;
};

export default function CampaignDetailPage() {
  const t = useTranslations("notifications");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const id = params.id as string;

  const [campaign, setCampaign] = useState<NotificationCampaign | null>(null);
  const [sends, setSends] = useState<SendWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/notifications/campaigns/${id}`)
      .then((r) => r.json())
      .then((json) => {
        setCampaign(json.data?.campaign ?? null);
        setSends(json.data?.sends ?? []);
        setLoading(false);
      });
  }, [id]);

  async function cancel() {
    await fetch(`/api/notifications/campaigns/${id}`, { method: "DELETE" });
    router.push(`/${locale}/dashboard/notifications`);
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">{t("loading")}</p>;
  if (!campaign) return <p className="text-sm text-[var(--muted)]">{t("notFound")}</p>;

  return (
    <div className="max-w-2xl">
      <button
        type="button"
        onClick={() => router.push(`/${locale}/dashboard/notifications`)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </button>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{campaign.title}</h1>
        <Badge variant={STATUS_VARIANT[campaign.status]} className="shrink-0 capitalize">
          {t(`status.${campaign.status}`)}
        </Badge>
      </div>
      <p className="mt-3 text-[var(--muted)]">{campaign.message}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {sends.length} {t("recipients")}
      </p>

      {(campaign.status === "scheduled" || campaign.status === "draft") && (
        <Button variant="outline" className="mt-4" onClick={cancel}>
          {t("cancelCampaign")}
        </Button>
      )}

      <div className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{t("sendsTitle")}</p>
        {sends.length === 0 ? (
          <Card className="mt-3">
            <p className="p-5 text-sm text-[var(--muted)]">{t("noSends")}</p>
          </Card>
        ) : (
          <div className="mt-3 space-y-2">
            {sends.map((send) => (
              <Card key={send.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[var(--ink)]">
                  {send.customer_progress?.customers?.name || t("unknownCustomer")}
                </span>
                <span className="text-[var(--muted)]">{t(`sendStatus.${send.status}`)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
