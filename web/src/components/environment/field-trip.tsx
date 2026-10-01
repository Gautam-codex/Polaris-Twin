"use client";

import { useState } from "react";
import { Map as MapIcon } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/dashboard/panel";
import { planFieldTrip } from "@/shared/fieldtrip";
import type { StationId, WeatherForecastPoint } from "@/shared/types";

const DESTINATIONS: Record<StationId, string[]> = {
  maitri: ["Priyadarshini Lake (1 km)", "Oasis ridge survey site (5 km)", "Ice shelf edge (vehicle, 80 km)"],
  bharati: ["Coastal sampling point (1 km)", "Larsemann Hills ridge (4 km)", "Inland ice plateau (vehicle, 15 km)"],
};

const STARTS = [
  { label: "Now", hours: 0 },
  { label: "In 3 h", hours: 3 },
  { label: "In 6 h", hours: 6 },
  { label: "In 12 h", hours: 12 },
  { label: "Tomorrow (24 h)", hours: 24 },
];

const VERDICT_STYLE = {
  Go: "border-success/40 bg-success/10 text-success",
  Caution: "border-warning/40 bg-warning/10 text-warning",
  "No-go": "border-destructive/40 bg-destructive/10 text-destructive",
} as const;

const fieldClass = "h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm text-foreground";

/** Go / no-go for a field trip window, judged on the worst forecast hour. */
export function FieldTripPlanner({ stationId, forecast, now }: { stationId: StationId; forecast: WeatherForecastPoint[]; now: number }) {
  const [destination, setDestination] = useState(0);
  const [start, setStart] = useState(0);
  const [hours, setHours] = useState(4);
  const [team, setTeam] = useState(3);
  const plan = planFieldTrip(forecast, now + start * 3_600_000, hours, team);

  return (
    <Panel title="Plan a field trip" icon={MapIcon}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-muted-foreground">Destination</span>
          <select className={fieldClass} value={destination} onChange={(e) => setDestination(Number(e.target.value))}>
            {DESTINATIONS[stationId].map((d, i) => (
              <option key={d} value={i} className="bg-card">
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Start</span>
          <select className={fieldClass} value={start} onChange={(e) => setStart(Number(e.target.value))}>
            {STARTS.map((s) => (
              <option key={s.hours} value={s.hours} className="bg-card">
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Duration (hours)</span>
          <Input type="number" min={1} max={24} value={hours} onChange={(e) => setHours(Math.max(1, Math.min(24, Number(e.target.value) || 1)))} className="h-9" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="text-muted-foreground">Team size</span>
          <Input type="number" min={1} max={12} value={team} onChange={(e) => setTeam(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} className="h-9" />
        </label>
      </div>

      <div className={cn("mt-5 rounded-xl border p-4", VERDICT_STYLE[plan.verdict])}>
        <p className="text-2xl font-semibold">{plan.verdict}</p>
        <p className="mt-1 text-sm">
          {DESTINATIONS[stationId][destination]} · worst-hour safety score {plan.minScore}/100
          {plan.worstTime && ` at ${plan.worstTime.slice(11, 16)} UTC`}
        </p>
        <ul className="mt-2 list-disc pl-5 text-sm text-foreground/80">
          {plan.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
