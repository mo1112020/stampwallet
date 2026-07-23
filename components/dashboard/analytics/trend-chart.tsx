"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { TrendPoint } from "@/lib/analytics/queries";
import { Reveal } from "@/components/motion/reveal";

const SCANS_COLOR = "#2a78d6";
const REDEMPTIONS_COLOR = "#eb6834";
const GRIDLINE = "var(--line)";
const AXIS_INK = "var(--muted)";

function formatDay(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const t = useTranslations("analytics");

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--muted)]">
        {t("noActivity")}
      </div>
    );
  }

  return (
    <Reveal className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-semibold text-[var(--ink)]">{t("trendTitle")}</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={GRIDLINE} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={{ fill: AXIS_INK, fontSize: 12 }}
              axisLine={{ stroke: GRIDLINE }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: AXIS_INK, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              labelFormatter={(value) => formatDay(value as string)}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--line)",
                fontSize: 13,
              }}
            />
            <Legend
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
            />
            <Line
              type="monotone"
              dataKey="scans"
              name={t("totalScans")}
              stroke={SCANS_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="redemptions"
              name={t("rewardsRedeemed")}
              stroke={REDEMPTIONS_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Reveal>
  );
}
