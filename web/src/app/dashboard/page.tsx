"use client";

import { cn } from "cn";
import { PageHeader } from "@/components/dashboard/page-header";
import { useStation } from "@/components/dashboard/station-context";
import { AlertsCard } from "@/components/overview/alerts-card";
import { MiniCharts } from "@/components/overview/mini-charts";
import { AtRiskCard, ResupplyCountdown } from "@/components/overview/resupply-card";
import { StatCards } from "@/components/overview/stat-cards";
import { TwinPreview } from "@/components/overview/twin-preview";
import { HEALTH_LABEL, HEALTH_STYLE } from "@/lib/health";

export default function OverviewPage() {
  const { station, snapshot } = useStation();

  return (
    <>
      <PageHeader
        title={`${station.name} control room`}
        description={`${station.region} · est. ${station.established}`}
        actions={
          snapshot && (
            <span className={cn("rounded border px-3 py-1 text-sm font-medium", HEALTH_STYLE[snapshot.overallHealth])}>
              Station {HEALTH_LABEL[snapshot.overallHealth]}
            </span>
          )
        }
      />
      {!snapshot ? (
        <p className="text-sm text-muted-foreground">Connecting to station feed…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <StatCards />
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <TwinPreview />
            </div>
            <AlertsCard />
          </div>
          <MiniCharts />
          <div className="grid gap-4 md:grid-cols-2">
            <AtRiskCard />
            <ResupplyCountdown />
          </div>
        </div>
      )}
    </>
  );
}
