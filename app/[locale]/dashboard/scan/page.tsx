"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CameraScanner } from "@/components/dashboard/scanner/camera-scanner";
import { renderPassFields } from "@/lib/wallet/renderPassFields";
import type { LoyaltyProgram, Progress } from "@/types";

type LookupResult = {
  pass_id: string;
  progress: Progress;
  program: Pick<LoyaltyProgram, "id" | "name" | "type" | "config" | "is_active">;
  customer: { name: string | null; phone: string | null; email: string | null } | null;
  business_name: string;
};

type ScanOutcome = {
  reward_available: boolean;
  reward_description: string;
};

type HistoryEntry = {
  id: string;
  delta: Record<string, number>;
  resulted_in_reward: boolean;
  created_at: string;
  customer_progress: {
    customers: { name: string | null } | null;
    loyalty_programs: { name: string } | null;
  } | null;
};

type Stage = "scanning" | "loading" | "confirm" | "submitting" | "result" | "error";

export default function ScanPage() {
  const t = useTranslations("scanner");
  const td = useTranslations("dashboard");
  const [stage, setStage] = useState<Stage>("scanning");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [amount, setAmount] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/scan/history?limit=10");
    if (!res.ok) return;
    const json = await res.json();
    setHistory(json.data ?? []);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function reset() {
    setStage("scanning");
    setLookup(null);
    setOutcome(null);
    setErrorMessage(null);
    setAmount(1);
  }

  async function handleScan(passId: string) {
    setStage("loading");
    const res = await fetch(`/api/scan/lookup?pass_id=${encodeURIComponent(passId)}`);
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error?.message ?? t("notFound"));
      setStage("error");
      return;
    }
    setLookup(json.data);
    setStage("confirm");
  }

  async function submit(action: "award" | "redeem") {
    if (!lookup) return;
    setStage("submitting");
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pass_id: lookup.pass_id,
        action,
        amount: action === "award" ? amount : undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error?.message ?? "Scan failed");
      setStage("error");
      return;
    }
    setOutcome({
      reward_available: json.data.reward_available,
      reward_description: json.data.reward_description,
    });
    setStage("result");
    loadHistory();
  }

  const fields =
    lookup &&
    renderPassFields(lookup.program.type, lookup.program.config, lookup.progress, lookup.business_name);
  const showAmountInput = lookup?.program.type === "points" || lookup?.program.type === "steps";

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("subtitle")}</p>

      <div className="mt-8">
        {stage === "scanning" && <CameraScanner onScan={handleScan} />}

        {(stage === "loading" || stage === "submitting") && (
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <p className="text-sm text-[var(--muted)]">{t("lookingUp")}</p>
          </div>
        )}

        {stage === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <Button className="mt-4" onClick={reset}>
              {t("scanAgain")}
            </Button>
          </div>
        )}

        {stage === "confirm" && lookup && fields && (
          <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
            <div>
              <p className="font-semibold">{lookup.customer?.name || t("unknownCustomer")}</p>
              {lookup.customer?.phone && (
                <p className="text-sm text-[var(--muted)]">{lookup.customer.phone}</p>
              )}
              <p className="mt-1 text-sm text-[var(--muted)]">{lookup.program.name}</p>
            </div>

            <div className="rounded-xl bg-white p-4 text-sm">
              <p className="text-[var(--muted)]">{fields.primaryLabel}</p>
              <p className="text-lg font-semibold">{fields.primaryValue}</p>
              {fields.rewardAvailable && (
                <p className="mt-2 font-semibold text-[var(--accent)]">{td("rewardAvailable")}</p>
              )}
            </div>

            {!lookup.program.is_active && (
              <p className="text-sm text-red-700">{t("programInactive")}</p>
            )}

            {showAmountInput && (
              <div>
                <Label htmlFor="amount">{td("pointsAmount")}</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!lookup.program.is_active}
                onClick={() => submit("award")}
              >
                {td("award")}
              </Button>
              {fields.rewardAvailable && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={!lookup.program.is_active}
                  onClick={() => submit("redeem")}
                >
                  {td("redeem")}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              {t("cancel")}
            </Button>
          </div>
        )}

        {stage === "result" && outcome && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
            <p className="text-lg font-semibold">
              {outcome.reward_available ? t("redeemSuccess") : t("awardSuccess")}
            </p>
            {outcome.reward_description && (
              <p className="mt-1 text-sm text-[var(--muted)]">{outcome.reward_description}</p>
            )}
            <Button className="mt-4" onClick={reset}>
              {t("scanAgain")}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-[var(--muted)]">{t("recentScans")}</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("noHistory")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {entry.customer_progress?.customers?.name || t("unknownCustomer")}
                  </p>
                  <p className="text-[var(--muted)]">
                    {entry.customer_progress?.loyalty_programs?.name}
                  </p>
                </div>
                <div className="text-right text-[var(--muted)]">
                  {entry.resulted_in_reward && (
                    <span className="mr-2 text-[var(--accent)]">🎁</span>
                  )}
                  {new Date(entry.created_at).toLocaleTimeString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
