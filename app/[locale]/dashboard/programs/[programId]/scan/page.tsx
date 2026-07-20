"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type ScanResult = {
  progress: unknown;
  reward_available: boolean;
  reward_description?: string;
};

export default function ScanPage() {
  const t = useTranslations("dashboard");
  const [passId, setPassId] = useState("");
  const [amount, setAmount] = useState(10);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(action: "award" | "redeem") {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pass_id: passId.trim(),
        action,
        amount: action === "award" ? amount : undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Scan failed");
      setResult(null);
      return;
    }
    setResult(json.data);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        {t("scan")}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Paste the customer pass ID from the QR code (camera scanning can be added on device).
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="pass">Pass ID</Label>
          <Input id="pass" value={passId} onChange={(e) => setPassId(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="amount">{t("pointsAmount")}</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {result && (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
            <pre className="overflow-auto">{JSON.stringify(result.progress, null, 2)}</pre>
            {result.reward_available && (
              <p className="mt-3 font-semibold text-[var(--accent)]">{t("rewardAvailable")}</p>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button disabled={loading || !passId} onClick={() => run("award")}>
            {t("award")}
          </Button>
          <Button
            variant="secondary"
            disabled={loading || !passId}
            onClick={() => run("redeem")}
          >
            {t("redeem")}
          </Button>
        </div>
      </div>
    </div>
  );
}
