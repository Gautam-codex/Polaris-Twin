"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { TOOLTIP_STYLE } from "@/components/energy/energy-charts";
import { useOps } from "@/components/dashboard/ops-context";
import { CHART } from "@/lib/health";
import { formatNumber } from "@/shared/alerts";
import type { FuelRunway } from "@/shared/types";

const DAY = 86_400_000;

/** Projected diesel stock from today until 30 days after the (possibly delayed) resupply. */
export function FuelProjection({ runway, fuelLitres, now }: { runway: FuelRunway; fuelLitres: number; now: number }) {
  const resupplyMs = Date.parse(`${runway.resupplyDate}T00:00:00Z`);
  const days = Math.ceil((resupplyMs - now) / DAY) + 30;
  const short = runway.marginDays < 0;
  const { lowBandwidth } = useOps();
  const step = lowBandwidth ? 7 : 1;
  const data = Array.from({ length: Math.floor(days / step) + 1 }, (_, i) => i * step).map((d) => ({
    t: now + d * DAY,
    fuel: Math.max(0, fuelLitres - runway.burnRateLpd * d),
  }));
  const color = short ? CHART.danger : CHART.primary;

  return (
    <Panel title="Fuel projection" icon={TrendingDown}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t: number) => new Date(t).toISOString().slice(5, 10)}
              stroke={CHART.axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(t) => new Date(Number(t)).toISOString().slice(0, 10)}
              formatter={(v) => [`${formatNumber(Number(v))} L`, "Projected diesel"]}
            />
            <ReferenceLine
              x={resupplyMs}
              stroke={CHART.primary}
              strokeDasharray="4 4"
              label={{ value: "Resupply", position: "insideTopRight", fill: CHART.primary, fontSize: 11 }}
            />
            <Area type="monotone" dataKey="fuel" stroke={color} strokeWidth={2} fill={short ? CHART.danger : CHART.brand} fillOpacity={short ? 0.12 : 0.45} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Straight-line projection at {formatNumber(runway.burnRateLpd)} L/day (rolling 24 h burn, adjusted for the scenario).
      </p>
    </Panel>
  );
}
