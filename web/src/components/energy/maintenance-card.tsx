"use client";

import { CheckCircle2, FlaskConical, Wrench } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/panel";
import { SEVERITY_STYLE } from "@/lib/health";
import { THRESHOLDS } from "@/shared/alerts";
import { minutesToLimit } from "@/shared/predictions";
import type { Alert, StationSnapshot } from "@/shared/types";

const TREND_POINTS = 4;

function eta(minutes: number | null): string {
  if (minutes === null) return "not rising";
  if (minutes === 0) return "limit already exceeded";
  if (minutes < 1) return "under 1 minute";
  if (minutes < 120) return `about ${Math.round(minutes)} min`;
  return `about ${Math.round(minutes / 60)} h`;
}

/** Plain-English warnings with a suggested action and time to failure if the trend continues. */
export function MaintenanceCard({
  history,
  stepMs,
  anomalies,
  faultActive,
  onToggleFault,
}: {
  history: StationSnapshot[];
  stepMs: number;
  anomalies: Alert[];
  faultActive: boolean;
  onToggleFault: () => void;
}) {
  const latest = history.at(-1);
  const recent = history.slice(-TREND_POINTS);

  return (
    <Panel
      title="Predictive maintenance"
      icon={Wrench}
      action={
        <Button size="sm" variant={faultActive ? "outline" : "secondary"} onClick={onToggleFault}>
          <FlaskConical />
          {faultActive ? "Clear demo fault" : "Simulate fault on Generator 1"}
        </Button>
      }
    >
      {anomalies.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 className="size-5 shrink-0" />
          All generators are within their normal range. No maintenance action needed.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {anomalies.map((a) => {
            const index = latest?.energy.generators.findIndex((g) => a.id.includes(`-${g.id}-`)) ?? -1;
            const coolant = recent.map((s) => s.energy.generators[index]?.coolantTempC ?? 0);
            const vibration = recent.map((s) => s.energy.generators[index]?.vibrationMm ?? 0);
            const isCoolant = a.id.endsWith("coolantTempC");
            const minutes = isCoolant
              ? minutesToLimit(coolant, stepMs, THRESHOLDS.coolantCriticalC)
              : minutesToLimit(vibration, stepMs, THRESHOLDS.vibrationCriticalMm);
            const limit = isCoolant ? `${THRESHOLDS.coolantCriticalC} °C coolant` : `${THRESHOLDS.vibrationCriticalMm} mm/s vibration`;
            return (
              <li key={a.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", SEVERITY_STYLE[a.severity])}>
                    {a.severity}
                  </span>
                  <span className="text-sm font-medium text-foreground">{a.title}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.message}</p>
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">Time to critical limit ({limit}) if the trend continues: </span>
                  <span className={cn("font-medium", minutes !== null && minutes < 10 ? "text-destructive" : "text-warning")}>
                    {eta(minutes)}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Z-score anomaly detection on the last 30 minutes of coolant and vibration readings (30 s samples).
      </p>
    </Panel>
  );
}
