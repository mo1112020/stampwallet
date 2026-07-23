"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { NotificationCampaign, NotificationSend } from "@/types";

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
      <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/dashboard/notifications`)}>
        ← {t("back")}
      </Button>

      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
        {campaign.title}
      </h1>
      <p className="mt-2 text-[var(--muted)]">{campaign.message}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {t(`status.${campaign.status}`)} · {sends.length} {t("recipients")}
      </p>

      {(campaign.status === "scheduled" || campaign.status === "draft") && (
        <Button variant="outline" className="mt-4" onClick={cancel}>
          {t("cancelCampaign")}
        </Button>
      )}

      <div className="mt-8">
        <p className="text-sm font-semibold text-[var(--ink)]">{t("sendsTitle")}</p>
        {sends.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("noSends")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sends.map((send) => (
              <li
                key={send.id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
              >
                <span className="text-[var(--ink)]">
                  {send.customer_progress?.customers?.name || t("unknownCustomer")}
                </span>
                <span className="text-[var(--muted)]">{t(`sendStatus.${send.status}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
