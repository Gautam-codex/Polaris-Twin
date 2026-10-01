"use client";

import { LifeBuoy } from "lucide-react";
import { cn } from "cn";
import { Slider } from "@/components/ui/slider";
import { Panel } from "@/components/dashboard/panel";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { formatNumber } from "@/shared/alerts";
import type { FuelRunway } from "@/shared/types";

function ScenarioSlider({
  label,
  value,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-3 text-sm">
      <span className="flex justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">
          {value} {unit}
        </span>
      </span>
      <Slider value={[value]} min={0} max={max} step={1} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)} />
    </label>
  );
}

/** "Days to survival" hero: what-if sliders recompute the fuel runway live. */
export function SurvivalCard({
  runway,
  fuelLitres,
  shipDelay,
  colder,
  onShipDelay,
  onColder,
}: {
  runway: FuelRunway | null;
  fuelLitres: number;
  shipDelay: number;
  colder: number;
  onShipDelay: (v: number) => void;
  onColder: (v: number) => void;
}) {
  const short = runway !== null && runway.marginDays < 0;
  return (
    <Panel
      title="Days to survival"
      icon={LifeBuoy}
      className={cn("transition-colors", short && "border-destructive/60 bg-destructive/10")}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className={cn("text-6xl font-medium tabular-nums", short ? "text-destructive" : "text-foreground")}>
            {runway ? <AnimatedNumber value={Math.floor(runway.daysLeft)} /> : "…"}
            <span className="ml-3 text-xl font-normal text-muted-foreground">days of diesel</span>
          </p>
          {runway && (
            <p className={cn("mt-3 text-base", short ? "text-destructive" : "text-success")}>
              {short
                ? `Fuel runs out ${Math.abs(Math.round(runway.marginDays))} days before the ship arrives (${runway.resupplyDate}).`
                : `${Math.round(runway.marginDays)} days in reserve when the ship arrives (${runway.resupplyDate}).`}
            </p>
          )}
          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">In tanks</dt>
              <dd className="font-medium tabular-nums">{formatNumber(fuelLitres)} L</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Burn rate</dt>
              <dd className="font-medium tabular-nums">{runway ? `${formatNumber(runway.burnRateLpd)} L/day` : "…"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Runs out</dt>
              <dd className="font-medium tabular-nums">{runway?.runoutDate ?? "…"}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col justify-center gap-6 rounded-md border border-border p-5">
          <ScenarioSlider label="Ship delay" value={shipDelay} max={60} unit="days" onChange={onShipDelay} />
          <ScenarioSlider label="Colder than forecast" value={colder} max={10} unit="°C" onChange={onColder} />
          <p className="text-xs text-muted-foreground">Each degree colder adds 2.5% to diesel burn for heating.</p>
        </div>
      </div>
    </Panel>
  );
}
