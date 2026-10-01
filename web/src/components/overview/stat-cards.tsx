"use client";

import { Activity, Fuel, ShieldCheck, Zap } from "lucide-react";
import { cn } from "cn";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { useFuelRunway } from "@/hooks/useFuelRunway";
import { HEALTH_LABEL, HEALTH_STYLE } from "@/lib/health";
import { formatNumber } from "@/shared/alerts";
import { safetyIndex } from "@/shared/predictions";
import type { Health } from "@/shared/types";

const SAFETY_HEALTH: Record<"Safe" | "Caution" | "Unsafe", Health> = { Safe: "ok", Caution: "warning", Unsafe: "critical" };

function Pill({ health, children }: { health: Health; children: React.ReactNode }) {
  return <span className={cn("rounded border px-2.5 py-0.5 text-xs font-medium", HEALTH_STYLE[health])}>{children}</span>;
}

export function StatCards() {
  const { snapshot, stationId } = useStation();
  const runway = useFuelRunway(stationId, snapshot?.fuelLitres ?? null, snapshot?.timestamp ?? null);
  if (!snapshot) return null;

  const { energy, weather, alerts, buildings, overallHealth } = snapshot;
  const issues = buildings.filter((b) => b.health !== "ok").length;
  const safety = safetyIndex(weather);
  const split = [
    { label: "Diesel", value: energy.dieselKw, color: "bg-primary" },
    { label: "Wind", value: energy.windKw, color: "bg-chart-2" },
    { label: "Solar", value: energy.solarKw, color: "bg-warning" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Panel title="Overall health" icon={Activity} action={<Pill health={overallHealth}>{HEALTH_LABEL[overallHealth]}</Pill>}>
        <p className="text-3xl font-medium tabular-nums">
          {buildings.length - issues}/{buildings.length}
          <span className="ml-2 text-base font-normal text-muted-foreground">systems OK</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {alerts.length === 0 ? "No live alerts" : `${alerts.length} live alert${alerts.length > 1 ? "s" : ""}`}
        </p>
      </Panel>

      <Panel title="Fuel runway" icon={Fuel}>
        <p className="text-3xl font-medium tabular-nums">
          {runway ? <AnimatedNumber value={runway.daysLeft} /> : "…"}
          <span className="ml-2 text-base font-normal text-muted-foreground">days</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {runway ? `Runs out ${runway.runoutDate} · ${formatNumber(runway.burnRateLpd)} L/day` : "Calculating…"}
        </p>
      </Panel>

      <Panel title="Power load" icon={Zap}>
        <p className="text-3xl font-medium tabular-nums">
          <AnimatedNumber value={energy.totalLoadKw} decimals={1} />
          <span className="ml-2 text-base font-normal text-muted-foreground">kW</span>
        </p>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
          {split.map((s) => (
            <div key={s.label} className={cn(s.color, "transition-[width] duration-700")} style={{ width: `${(s.value / energy.totalLoadKw) * 100}%` }} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {split.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", s.color)} />
              {s.label} {s.value.toFixed(0)} kW
            </span>
          ))}
        </div>
      </Panel>

      <Panel
        title="Field safety index"
        icon={ShieldCheck}
        action={<Pill health={SAFETY_HEALTH[safety.label]}>{safety.label}</Pill>}
      >
        <p className="text-3xl font-medium tabular-nums">
          <AnimatedNumber value={safety.score} />
          <span className="ml-2 text-base font-normal text-muted-foreground">/ 100</span>
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{safety.reasons[0]}</p>
      </Panel>
    </div>
  );
}
