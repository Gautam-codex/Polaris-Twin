"use client";

import { Droplets, Fuel, Gauge, Thermometer, Wind, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/dashboard/page-header";
import { useStation } from "@/components/dashboard/station-context";
import { formatNumber } from "@/shared/alerts";
import type { Health } from "@/shared/types";

const HEALTH_LABEL: Record<Health, string> = { ok: "OK", warning: "Warning", critical: "Critical" };

const HEALTH_STYLE: Record<Health, string> = {
  ok: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
};

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function OverviewPage() {
  const { station, snapshot, loading } = useStation();

  return (
    <>
      <PageHeader
        title={`${station.name} overview`}
        description={`${station.region} · est. ${station.established}`}
        actions={
          snapshot && (
            <span className={cn("rounded-full border px-3 py-1 text-sm font-medium", HEALTH_STYLE[snapshot.overallHealth])}>
              Station {HEALTH_LABEL[snapshot.overallHealth]}
            </span>
          )
        }
      />
      {loading || !snapshot ? (
        <p className="text-sm text-muted-foreground">Connecting to station feed…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat icon={Thermometer} label="Outside temperature" value={`${snapshot.weather.tempC} °C`} />
          <Stat icon={Wind} label="Wind" value={`${snapshot.weather.windKph} km/h`} />
          <Stat icon={Gauge} label="Station load" value={`${snapshot.energy.totalLoadKw} kW`} />
          <Stat icon={Fuel} label="Diesel stock" value={`${formatNumber(snapshot.fuelLitres)} L`} />
          <Stat icon={Droplets} label="Water stored" value={`${formatNumber(snapshot.waterLitres)} L`} />
        </div>
      )}
    </>
  );
}
