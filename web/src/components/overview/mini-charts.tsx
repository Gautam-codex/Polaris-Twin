"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { CHART, TOOLTIP_STYLE } from "@/lib/health";
import { formatNumber } from "@/shared/alerts";
import type { StationSnapshot } from "@/shared/types";

interface Series {
  key: string;
  title: string;
  unit: string;
  color: string;
  pick: (s: StationSnapshot) => number;
  decimals: number;
  /** Smallest y-axis span, so sensor noise doesn't fill the chart. */
  minSpan: number;
}

const SERIES: Series[] = [
  { key: "temp", title: "Outside temperature", unit: "°C", color: CHART.primary, pick: (s) => s.weather.tempC, decimals: 1, minSpan: 4 },
  { key: "load", title: "Station load", unit: "kW", color: CHART.secondary, pick: (s) => s.energy.totalLoadKw, decimals: 1, minSpan: 40 },
  { key: "fuel", title: "Diesel stock", unit: "L", color: CHART.primary, pick: (s) => s.fuelLitres, decimals: 0, minSpan: 200 },
];

function fmt(value: number, decimals: number): string {
  return decimals === 0 ? formatNumber(value) : value.toFixed(decimals);
}

/** Y domain centred on the data, at least `minSpan` wide. */
function domain(values: number[], minSpan: number): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, minSpan) * 1.1;
  const mid = (min + max) / 2;
  return [mid - span / 2, mid + span / 2];
}

function clock(ms: number): string {
  return new Date(ms).toISOString().slice(11, 16);
}

function MiniChart({ series, history }: { series: Series; history: StationSnapshot[] }) {
  const data = history.map((s) => ({ t: s.timestamp, v: series.pick(s) }));
  const latest = data.at(-1)?.v;
  return (
    <Panel
      title={series.title}
      action={
        <span className="text-sm font-medium tabular-nums text-foreground">
          {latest === undefined ? "…" : `${fmt(latest, series.decimals)} ${series.unit}`}
        </span>
      }
    >
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="t" tickFormatter={clock} stroke={CHART.axis} fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis
              domain={domain(data.map((d) => d.v), series.minSpan)}
              tickFormatter={(v: number) => fmt(v, 0)}
              stroke={CHART.axis}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(t) => `${clock(Number(t))} UTC`}
              formatter={(v) => [`${fmt(Number(v), series.decimals)} ${series.unit}`, series.title]}
            />
            <Line type="monotone" dataKey="v" stroke={series.color} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Last 10 minutes</p>
    </Panel>
  );
}

export function MiniCharts() {
  const { history } = useStation();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {SERIES.map((s) => (
        <MiniChart key={s.key} series={s} history={history} />
      ))}
    </div>
  );
}
