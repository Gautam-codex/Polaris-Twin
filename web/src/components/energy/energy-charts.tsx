"use client";

import { Area, AreaChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Flame, Layers } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { CHART } from "@/lib/health";
import type { StationSnapshot } from "@/shared/types";

export const TOOLTIP_STYLE = { background: "#111A2E", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 };

export function hhmm(ms: number): string {
  return new Date(ms).toISOString().slice(11, 16);
}

/** Diesel, wind and solar stacked over the last 24 h. */
export function SupplyMixChart({ history }: { history: StationSnapshot[] }) {
  const data = history.map((s) => ({ t: s.timestamp, diesel: s.energy.dieselKw, wind: s.energy.windKw, solar: s.energy.solarKw }));
  return (
    <Panel title="Power supply mix · last 24 h" icon={Layers}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="t" tickFormatter={hhmm} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} width={44} unit=" kW" />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(t) => `${hhmm(Number(t))} UTC`} formatter={(v, name) => [`${Number(v).toFixed(0)} kW`, String(name)]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="diesel" name="Diesel" stackId="1" stroke={CHART.warning} fill={CHART.warning} fillOpacity={0.35} />
            <Area type="monotone" dataKey="wind" name="Wind" stackId="1" stroke={CHART.primary} fill={CHART.primary} fillOpacity={0.35} />
            <Area type="monotone" dataKey="solar" name="Solar" stackId="1" stroke={CHART.success} fill={CHART.success} fillOpacity={0.35} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

/** Heating demand against outside temperature over the last 24 h. */
export function HeatingChart({ history }: { history: StationSnapshot[] }) {
  const data = history.map((s) => ({ t: s.timestamp, heating: s.energy.heatingDemandKw, temp: s.weather.tempC }));
  return (
    <Panel title="Heating demand vs outside temperature · last 24 h" icon={Flame}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="t" tickFormatter={hhmm} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis yAxisId="kw" stroke={CHART.warning} fontSize={11} tickLine={false} axisLine={false} width={44} unit=" kW" />
            <YAxis yAxisId="c" orientation="right" stroke={CHART.primary} fontSize={11} tickLine={false} axisLine={false} width={40} unit="°" />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(t) => `${hhmm(Number(t))} UTC`}
              formatter={(v, name) => [name === "Heating demand" ? `${Number(v).toFixed(0)} kW` : `${Number(v).toFixed(1)} °C`, String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="kw" type="monotone" dataKey="heating" name="Heating demand" stroke={CHART.warning} strokeWidth={2} dot={false} />
            <Line yAxisId="c" type="monotone" dataKey="temp" name="Outside temp" stroke={CHART.primary} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
