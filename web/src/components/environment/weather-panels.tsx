"use client";

import { CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CloudSun, Droplets, Snowflake, Thermometer } from "lucide-react";
import { cn } from "cn";
import { Panel } from "@/components/dashboard/panel";
import { TOOLTIP_STYLE } from "@/components/energy/energy-charts";
import { CHART } from "@/lib/health";
import { formatNumber } from "@/shared/alerts";
import type { Station, StationSnapshot, WeatherForecastPoint, WeatherSnapshot } from "@/shared/types";

function SourceBadge({ source }: { source: WeatherSnapshot["source"] }) {
  const live = source === "open-meteo";
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
        live ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning",
      )}
    >
      {live ? "Live: Open-Meteo" : "Simulated"}
    </span>
  );
}

export function LiveWeather({ weather }: { weather: WeatherSnapshot }) {
  const items = [
    { label: "Temperature", value: `${weather.tempC} °C` },
    { label: "Wind", value: `${weather.windKph} km/h` },
    { label: "Wind chill", value: `${weather.windChillC} °C` },
    { label: "Visibility", value: `${weather.visibilityKm} km` },
  ];
  return (
    <Panel title="Current weather" icon={Thermometer} action={<SourceBadge source={weather.source} />}>
      <dl className="grid grid-cols-2 gap-4">
        {items.map((i) => (
          <div key={i.label}>
            <dt className="text-sm text-muted-foreground">{i.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{i.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function hourLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:00`;
}

export function ForecastChart({ forecast, source }: { forecast: WeatherForecastPoint[]; source: WeatherSnapshot["source"] }) {
  return (
    <Panel title="48 h forecast" icon={CloudSun} action={<SourceBadge source={source} />}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecast} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="time" tickFormatter={hourLabel} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} minTickGap={40} />
            <YAxis yAxisId="c" stroke={CHART.primary} fontSize={11} tickLine={false} axisLine={false} width={36} unit="°" />
            <YAxis yAxisId="w" orientation="right" stroke={CHART.warning} fontSize={11} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(t) => `${hourLabel(String(t))} UTC`}
              formatter={(v, name) => [name === "Temperature" ? `${Number(v).toFixed(1)} °C` : `${Number(v).toFixed(0)} km/h`, String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="c" type="monotone" dataKey="tempC" name="Temperature" stroke={CHART.primary} strokeWidth={2} dot={false} />
            <Line yAxisId="w" type="monotone" dataKey="windKph" name="Wind (km/h)" stroke={CHART.warning} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

/** Snow depth and stored water, with the station's water source. */
export function StockCards({ snapshot, station }: { snapshot: StationSnapshot; station: Station }) {
  const waterSource = station.id === "maitri" ? "Priyadarshini Lake (pumped)" : "Water treatment plant";
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Panel title="Snow depth" icon={Snowflake}>
        <p className="text-3xl font-semibold tabular-nums">{snapshot.weather.snowCm} cm</p>
        <p className="mt-2 text-sm text-muted-foreground">Around the station buildings. Drifts build up fastest in blizzards.</p>
      </Panel>
      <Panel title="Water stock" icon={Droplets}>
        <p className="text-3xl font-semibold tabular-nums">{formatNumber(snapshot.waterLitres)} L</p>
        <p className="mt-2 text-sm text-muted-foreground">Source: {waterSource}</p>
      </Panel>
    </div>
  );
}
