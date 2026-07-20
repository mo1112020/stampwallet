"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { WalletPreview } from "@/components/wallet-preview/wallet-preview";
import type { ProgramConfig, ProgramType, StepsConfig } from "@/types";

const defaultConfigs: Record<ProgramType, ProgramConfig> = {
  stamp: { stamps_required: 10, reward_description: "Free coffee", icon: "☕" },
  points: { points_per_reward: 1000, reward_description: "Free gift", points_label: "pts" },
  steps: {
    stages: [
      { key: "welcome", label: "Welcome Gift", threshold: 0 },
      { key: "free_drink", label: "Free Drink", threshold: 5 },
      { key: "discount", label: "10% Discount", threshold: 10 },
      { key: "vip", label: "VIP Member", threshold: 20 },
    ],
  },
};

type Props = {
  mode: "create" | "edit";
  initial?: {
    id: string;
    name: string;
    type: ProgramType;
    config: ProgramConfig;
    is_active: boolean;
  };
  businessName?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export function ProgramForm({
  mode,
  initial,
  businessName = "Your business",
  primaryColor = "#3E0856",
  secondaryColor = "#FAAE62",
}: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<ProgramType>(initial?.type ?? "stamp");
  const [config, setConfig] = useState<ProgramConfig>(initial?.config ?? defaultConfigs.stamp);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrollUrl, setEnrollUrl] = useState<string | null>(null);

  const previewConfig = useMemo(() => config, [config]);

  function switchType(next: ProgramType) {
    setType(next);
    setConfig(defaultConfigs[next]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = mode === "create" ? "/api/programs" : `/api/programs/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const body =
      mode === "create"
        ? { name, type, config }
        : { name, config, is_active: isActive };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Failed");
      return;
    }

    if (mode === "create" && json.data?.enrollment_url) {
      setEnrollUrl(json.data.enrollment_url);
    }
    router.push(`/${locale}/dashboard/programs/${json.data.id}`);
    router.refresh();
  }

  async function deactivate() {
    if (!initial) return;
    setLoading(true);
    const res = await fetch(`/api/programs/${initial.id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push(`/${locale}/dashboard/programs`);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Program name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {mode === "create" && (
          <div>
            <Label>Type</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["stamp", "points", "steps"] as ProgramType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchType(t)}
                  className={`rounded-lg px-3 py-2 text-sm capitalize ${
                    type === t ? "bg-[var(--brand)] text-white" : "border border-[var(--line)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "stamp" && (
          <>
            <div>
              <Label>Stamps required</Label>
              <Input
                type="number"
                min={1}
                value={(config as { stamps_required: number }).stamps_required}
                onChange={(e) =>
                  setConfig({
                    ...(config as object),
                    stamps_required: Number(e.target.value),
                  } as ProgramConfig)
                }
              />
            </div>
            <div>
              <Label>Reward</Label>
              <Input
                value={(config as { reward_description: string }).reward_description}
                onChange={(e) =>
                  setConfig({
                    ...(config as object),
                    reward_description: e.target.value,
                  } as ProgramConfig)
                }
              />
            </div>
            <div>
              <Label>Icon</Label>
              <Input
                value={(config as { icon: string }).icon}
                onChange={(e) =>
                  setConfig({ ...(config as object), icon: e.target.value } as ProgramConfig)
                }
              />
            </div>
          </>
        )}

        {type === "points" && (
          <>
            <div>
              <Label>Points per reward</Label>
              <Input
                type="number"
                min={1}
                value={(config as { points_per_reward: number }).points_per_reward}
                onChange={(e) =>
                  setConfig({
                    ...(config as object),
                    points_per_reward: Number(e.target.value),
                  } as ProgramConfig)
                }
              />
            </div>
            <div>
              <Label>Reward</Label>
              <Input
                value={(config as { reward_description: string }).reward_description}
                onChange={(e) =>
                  setConfig({
                    ...(config as object),
                    reward_description: e.target.value,
                  } as ProgramConfig)
                }
              />
            </div>
            <div>
              <Label>Points label</Label>
              <Input
                value={(config as { points_label: string }).points_label}
                onChange={(e) =>
                  setConfig({
                    ...(config as object),
                    points_label: e.target.value,
                  } as ProgramConfig)
                }
              />
            </div>
          </>
        )}

        {type === "steps" && (
          <div className="space-y-3">
            <Label>Stages</Label>
            {(config as StepsConfig).stages.map((stage, idx) => (
              <div key={stage.key} className="grid grid-cols-3 gap-2">
                <Input
                  value={stage.label}
                  onChange={(e) => {
                    const stages = [...(config as StepsConfig).stages];
                    stages[idx] = { ...stage, label: e.target.value };
                    setConfig({ stages });
                  }}
                />
                <Input
                  type="number"
                  value={stage.threshold}
                  onChange={(e) => {
                    const stages = [...(config as StepsConfig).stages];
                    stages[idx] = { ...stage, threshold: Number(e.target.value) };
                    setConfig({ stages });
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const stages = (config as StepsConfig).stages.filter((_, i) => i !== idx);
                    setConfig({ stages });
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const stages = [
                  ...(config as StepsConfig).stages,
                  {
                    key: `stage_${Date.now()}`,
                    label: "New stage",
                    threshold: ((config as StepsConfig).stages.at(-1)?.threshold ?? 0) + 5,
                  },
                ];
                setConfig({ stages });
              }}
            >
              Add stage
            </Button>
          </div>
        )}

        {mode === "edit" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}
        {enrollUrl && (
          <p className="rounded-lg bg-[var(--surface-2)] p-3 text-sm break-all">
            Enrollment: {enrollUrl}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>
            Save
          </Button>
          {mode === "edit" && (
            <Button type="button" variant="danger" disabled={loading} onClick={deactivate}>
              Deactivate
            </Button>
          )}
        </div>
      </form>

      <div>
        <p className="mb-4 text-sm font-medium text-[var(--muted)]">Live wallet preview</p>
        <WalletPreview
          type={type}
          config={previewConfig}
          businessName={businessName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>
    </div>
  );
}
