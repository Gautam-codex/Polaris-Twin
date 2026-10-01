"use client";

import { Cog } from "lucide-react";
import { cn } from "cn";
import { Panel } from "@/components/dashboard/panel";
import { Sparkline } from "@/components/dashboard/sparkline";
import { CHART, HEALTH_LABEL, HEALTH_STYLE, SEVERITY_STYLE } from "@/lib/health";
import { THRESHOLDS, generatorHealth } from "@/shared/alerts";
import type { Alert, StationSnapshot } from "@/shared/types";

function Meter({ value, max, warn, critical }: { value: number; max: number; warn: number; critical: number }) {
  const color = value >= critical ? "bg-destructive" : value >= warn ? "bg-warning" : "bg-primary";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-[width] duration-700", color)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

/** One card per generator with load, coolant and vibration, plus anomaly badges. */
export function GeneratorCards({ history, anomalies }: { history: StationSnapshot[]; anomalies: Alert[] }) {
  const latest = history.at(-1);
  if (!latest) return null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {latest.energy.generators.map((g, index) => {
        const health = generatorHealth(g);
        const series = history.map((s) => s.energy.generators[index]);
        const badges = anomalies.filter((a) => a.id.includes(`-${g.id}-`));
        return (
          <Panel
            key={g.id}
            title={g.name}
            icon={Cog}
            action={<span className={cn("rounded border px-2.5 py-0.5 text-xs font-medium", HEALTH_STYLE[health])}>{HEALTH_LABEL[health]}</span>}
          >
            <p className="text-sm text-muted-foreground">{g.running ? "Running" : "Standby"} · {g.fuelBurnLph} L/h</p>
            <div className="mt-4 flex flex-col gap-4 text-sm">
              <div>
                <div className="mb-1.5 flex justify-between">
                  <span className="text-muted-foreground">Load</span>
                  <span className="tabular-nums">{g.loadKw.toFixed(0)} / {g.capacityKw} kW</span>
                </div>
                <Meter value={g.loadKw} max={g.capacityKw} warn={g.capacityKw * 0.85} critical={g.capacityKw * 0.95} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-muted-foreground">Coolant</p>
                  <p className="tabular-nums">{g.coolantTempC.toFixed(1)} °C</p>
                </div>
                <Sparkline values={series.map((s) => s.coolantTempC)} color={g.coolantTempC >= THRESHOLDS.coolantWarnC ? CHART.danger : CHART.warning} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-muted-foreground">Vibration</p>
                  <p className="tabular-nums">{g.vibrationMm.toFixed(2)} mm/s</p>
                </div>
                <Sparkline values={series.map((s) => s.vibrationMm)} color={g.vibrationMm >= THRESHOLDS.vibrationWarnMm ? CHART.danger : CHART.success} />
              </div>
            </div>
            {badges.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {badges.map((a) => (
                  <span key={a.id} className={cn("rounded border px-2 py-0.5 text-[11px] font-medium", SEVERITY_STYLE[a.severity])}>
                    {a.title.replace(`${g.name} `, "")}
                  </span>
                ))}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
