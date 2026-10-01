"use client";

import { X } from "lucide-react";
import { cn } from "cn";
import { Sparkline } from "@/components/dashboard/sparkline";
import { HEALTH_LABEL, HEALTH_STYLE, CHART } from "@/lib/health";
import { formatNumber } from "@/shared/alerts";
import type { Building, StationSnapshot } from "@/shared/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function GeneratorReadings({ history }: { history: StationSnapshot[] }) {
  const latest = history.at(-1);
  if (!latest) return null;
  return (
    <div className="flex flex-col gap-3">
      {latest.energy.generators.map((g, index) => {
        const series = history.map((s) => s.energy.generators[index]);
        return (
          <div key={g.id} className="rounded-md border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{g.name}</span>
              <span className={cn("text-xs", g.running ? "text-success" : "text-muted-foreground")}>
                {g.running ? `Running · ${g.loadKw.toFixed(0)}/${g.capacityKw} kW` : "Standby"}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Load {g.loadKw.toFixed(0)} kW</span>
              <Sparkline values={series.map((s) => s.loadKw)} color={CHART.primary} width={96} height={22} />
              <span className={g.coolantTempC >= 95 ? "text-destructive" : undefined}>Coolant {g.coolantTempC.toFixed(1)} °C</span>
              <Sparkline values={series.map((s) => s.coolantTempC)} color={g.coolantTempC >= 95 ? CHART.danger : CHART.warning} width={96} height={22} />
              <span className={g.vibrationMm >= 5 ? "text-destructive" : undefined}>Vibration {g.vibrationMm.toFixed(2)} mm/s</span>
              <Sparkline values={series.map((s) => s.vibrationMm)} color={g.vibrationMm >= 5 ? CHART.danger : CHART.success} width={96} height={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Readings({ building, snapshot }: { building: Building; snapshot: StationSnapshot }) {
  const { energy, weather } = snapshot;
  switch (building.type) {
    case "living":
    case "lab":
    case "medical":
      return (
        <>
          <Row label="Heating demand" value={`${energy.heatingDemandKw} kW`} />
          <Row label="Station load" value={`${energy.totalLoadKw} kW`} />
          <Row label="Outside temperature" value={`${weather.tempC} °C`} />
          <Row label="Battery backup" value={`${energy.batteryPct}%`} />
        </>
      );
    case "water":
      return (
        <>
          <Row label="Water stored" value={`${formatNumber(snapshot.waterLitres)} L`} />
          <Row label="Outside temperature" value={`${weather.tempC} °C`} />
        </>
      );
    case "storage":
      return (
        <>
          <Row label="Diesel stock" value={`${formatNumber(snapshot.fuelLitres)} L`} />
          <Row label="Diesel burn" value={`${energy.generators.reduce((s, g) => s + g.fuelBurnLph, 0).toFixed(1)} L/h`} />
        </>
      );
    case "comms":
      return (
        <>
          <Row label="Wind at mast" value={`${weather.windKph} km/h`} />
          <Row label="Visibility" value={`${weather.visibilityKm} km`} />
          <Row label="Satellite link" value={building.health === "ok" ? "Nominal" : "At risk in high wind"} />
        </>
      );
    case "waste":
      return <Row label="Incinerator" value="Normal operation" />;
    case "power":
      return null;
  }
}

export function BuildingPanel({
  building,
  snapshot,
  history,
  onClose,
}: {
  building: Building;
  snapshot: StationSnapshot;
  history: StationSnapshot[];
  onClose: () => void;
}) {
  return (
    <aside className="flex flex-col rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{building.type}</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">{building.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted" aria-label="Close panel">
          <X className="size-4" />
        </button>
      </div>
      <span className={cn("mt-3 w-fit rounded border px-2.5 py-0.5 text-xs font-medium", HEALTH_STYLE[building.health])}>
        {HEALTH_LABEL[building.health]}
      </span>
      <div className="mt-4 divide-y divide-border">
        {building.type === "power" ? <GeneratorReadings history={history} /> : <Readings building={building} snapshot={snapshot} />}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Simulated sensor feed · updates every 5 s</p>
    </aside>
  );
}
