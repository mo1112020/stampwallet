"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CameraScanner } from "@/components/scanner/camera-scanner";
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

/**
 * The scan/confirm/result/history flow shared by the dashboard's Scan page
 * and the standalone Scanner PWA — same backend (/api/scan, /api/scan/
 * lookup, /api/scan/history), different chrome around it. Callers own the
 * page title and layout; this owns the interactive part.
 */
export function ScanFlow({ dark = false }: { dark?: boolean }) {
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

  const cardClass = dark
    ? "rounded-2xl border border-white/10 bg-white/5 p-6"
    : "rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6";
  const mutedClass = dark ? "text-white/60" : "text-[var(--muted)]";

  return (
    <div>
      <div>
        {stage === "scanning" && <CameraScanner onScan={handleScan} />}

        {(stage === "loading" || stage === "submitting") && (
          <div
            className={`flex aspect-square w-full items-center justify-center rounded-2xl border ${
              dark ? "border-white/10 bg-white/5" : "border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            <p className={`text-sm ${mutedClass}`}>{t("lookingUp")}</p>
          </div>
        )}

        {stage === "error" && (
          <div
            className={`rounded-2xl border p-6 text-center ${
              dark ? "border-red-400/20 bg-red-500/10" : "border-[var(--danger)]/20 bg-[var(--danger-soft)]"
            }`}
          >
            <p className={`text-sm ${dark ? "text-red-300" : "text-[var(--danger)]"}`}>{errorMessage}</p>
            <Button className="mt-4" onClick={reset}>
              {t("scanAgain")}
            </Button>
          </div>
        )}

        {stage === "confirm" && lookup && fields && (
          <div className={`space-y-4 ${cardClass}`}>
            <div>
              <p className="font-semibold">{lookup.customer?.name || t("unknownCustomer")}</p>
              {lookup.customer?.phone && (
                <p className={`text-sm ${mutedClass}`}>{lookup.customer.phone}</p>
              )}
              <p className={`mt-1 text-sm ${mutedClass}`}>{lookup.program.name}</p>
            </div>

            <div className={dark ? "rounded-xl bg-white/10 p-4 text-sm" : "rounded-xl bg-[var(--surface-2)] p-4 text-sm"}>
              <p className={mutedClass}>{fields.primaryLabel}</p>
              <p className="text-lg font-semibold">{fields.primaryValue}</p>
              {fields.rewardAvailable && (
                <p className="mt-2 font-semibold text-[var(--accent)]">{td("rewardAvailable")}</p>
              )}
            </div>

            {!lookup.program.is_active && (
              <p className={`text-sm ${dark ? "text-red-400" : "text-[var(--danger)]"}`}>{t("programInactive")}</p>
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
          <div className={`text-center ${cardClass}`}>
            <p className="text-lg font-semibold">
              {outcome.reward_available ? t("redeemSuccess") : t("awardSuccess")}
            </p>
            {outcome.reward_description && (
              <p className={`mt-1 text-sm ${mutedClass}`}>{outcome.reward_description}</p>
            )}
            <Button className="mt-4" onClick={reset}>
              {t("scanAgain")}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className={`text-sm font-semibold ${mutedClass}`}>{t("recentScans")}</h2>
        {history.length === 0 ? (
          <p className={`mt-2 text-sm ${mutedClass}`}>{t("noHistory")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                  dark ? "border-white/10 bg-white/5" : "border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                <div>
                  <p className="font-medium">
                    {entry.customer_progress?.customers?.name || t("unknownCustomer")}
                  </p>
                  <p className={mutedClass}>{entry.customer_progress?.loyalty_programs?.name}</p>
                </div>
                <div className={`text-right ${mutedClass}`}>
                  {entry.resulted_in_reward && (
                    <span className="me-2 text-[var(--accent)]">🎁</span>
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
