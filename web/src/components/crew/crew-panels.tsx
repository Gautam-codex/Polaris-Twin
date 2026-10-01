"use client";

import { useMemo } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HeartPulse, Sun } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { CHART, TOOLTIP_STYLE } from "@/lib/health";
import { MIN_RESPONSES, WINDOW_DAYS, type RollingPoint } from "@/hooks/useWellbeing";
import { daylightHours, polarPeriods } from "@/shared/daylight";
import type { Station } from "@/shared/types";

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function WellbeingChart({ points }: { points: RollingPoint[] }) {
  return (
    <Panel title="Crew wellbeing · last 14 days" icon={HeartPulse}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={shortDate} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis yAxisId="score" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} width={28} />
            <YAxis yAxisId="sleep" orientation="right" domain={[0, 10]} stroke={CHART.axis} fontSize={11} tickLine={false} axisLine={false} width={32} unit="h" />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(d) => `${WINDOW_DAYS} days to ${String(d)}`}
              formatter={(v, name) => [name === "Sleep" ? `${v} h` : `${v} / 5`, String(name)]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="score" type="monotone" dataKey="energy" name="Energy" stroke={CHART.secondary} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} />
            <Line yAxisId="score" type="monotone" dataKey="mood" name="Mood" stroke={CHART.primary} strokeWidth={2} dot={false} connectNulls={false} />
            <Line yAxisId="sleep" type="monotone" dataKey="sleepHours" name="Sleep" stroke={CHART.warning} strokeWidth={2} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Anonymous check-ins only. Each point is a {WINDOW_DAYS}-day average and is hidden when fewer than {MIN_RESPONSES} people
        checked in, so no individual answer can be identified.
      </p>
    </Panel>
  );
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function DaylightCard({ station, now }: { station: Station; now: number }) {
  const year = new Date(now).getUTCFullYear();
  const today = daylightHours(station.lat, now);
  const tomorrow = daylightHours(station.lat, now + 86_400_000);
  const periods = useMemo(() => polarPeriods(station.lat, year), [station.lat, year]);
  const hours = Math.floor(today);
  const minutes = Math.round((today - hours) * 60);
  const change = Math.round((tomorrow - today) * 60);

  return (
    <Panel title={`Daylight at ${station.name}`} icon={Sun}>
      <p className="text-3xl font-medium tabular-nums">
        {today === 0 ? "Polar night" : today === 24 ? "24 h" : `${hours} h ${minutes} min`}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Today at {Math.abs(station.lat).toFixed(1)}° S
        {today > 0 && today < 24 && ` · ${change >= 0 ? "+" : ""}${change} min tomorrow`}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Polar night {year}</dt>
          <dd className="font-medium">
            {periods.night ? `${formatDay(periods.night.start)} – ${formatDay(periods.night.end)} (${periods.night.days} days)` : "None"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Midnight sun</dt>
          <dd className="font-medium">
            {periods.midnightSun
              ? `${formatDay(periods.midnightSun.start)} – ${formatDay(periods.midnightSun.end)} (${periods.midnightSun.days} days)`
              : "None"}
          </dd>
        </div>
      </dl>
      <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">
        During the polar night the sun does not rise. Keep regular sleep times, use daylight lamps in the morning and plan
        outdoor activity in the brightest hours to reduce winter-over fatigue.
      </p>
    </Panel>
  );
}
