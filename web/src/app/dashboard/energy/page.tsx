"use client";

import { useMemo, useState } from "react";
import { BatteryMedium } from "lucide-react";
import { Gauge } from "@/components/dashboard/gauge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { HeatingChart, SupplyMixChart } from "@/components/energy/energy-charts";
import { GeneratorCards } from "@/components/energy/generator-cards";
import { MaintenanceCard } from "@/components/energy/maintenance-card";
import { useOps } from "@/components/dashboard/ops-context";
import { useSampledHistory } from "@/hooks/useSampledHistory";
import { CHART } from "@/lib/health";
import { detectAnomalies } from "@/shared/predictions";
import { getFault, setFault } from "@/shared/simulator";

const MINUTE = 60_000;
const ANOMALY_STEP = 30_000;

export default function EnergyPage() {
  const { stationId, station, snapshot } = useStation();
  const [faultVersion, setFaultVersion] = useState(0);
  const timestamp = snapshot?.timestamp ?? null;

  const recent = useSampledHistory(stationId, timestamp, 30 * MINUTE, ANOMALY_STEP, faultVersion);
  const { lowBandwidth } = useOps();
  const day = useSampledHistory(stationId, timestamp, 24 * 60 * MINUTE, (lowBandwidth ? 120 : 30) * MINUTE);
  const anomalies = useMemo(() => detectAnomalies(recent), [recent]);
  const faultActive = faultVersion >= 0 && getFault(stationId) !== null;

  const toggleFault = () => {
    setFault(stationId, faultActive ? null : "dg-1");
    setFaultVersion((v) => v + 1);
  };

  const battery = snapshot?.energy.batteryPct ?? 0;
  const batteryColor = battery < 45 ? CHART.danger : battery < 60 ? CHART.warning : CHART.success;

  return (
    <>
      <PageHeader
        title="Energy"
        description={`${station.name}: three 250 kW diesel generators, a small wind turbine and solar array, and a battery bank.`}
      />
      {!snapshot ? (
        <p className="text-sm text-muted-foreground">Connecting to station feed…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <GeneratorCards history={recent} anomalies={anomalies} />
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MaintenanceCard
                history={recent}
                stepMs={ANOMALY_STEP}
                anomalies={anomalies}
                faultActive={faultActive}
                onToggleFault={toggleFault}
              />
            </div>
            <Panel title="Battery bank" icon={BatteryMedium}>
              <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2">
                <Gauge value={battery} color={batteryColor} label={`${battery.toFixed(0)}%`} sublabel="State of charge" />
                <p className="text-center text-xs text-muted-foreground">
                  Buffers generator switchovers. Below 45% a generator stays on standby.
                </p>
              </div>
            </Panel>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <SupplyMixChart history={day} />
            <HeatingChart history={day} />
          </div>
        </div>
      )}
    </>
  );
}
