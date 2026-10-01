"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useStation } from "@/components/dashboard/station-context";
import { FuelProjection } from "@/components/logistics/fuel-projection";
import { InventoryTable } from "@/components/logistics/inventory-table";
import { SurvivalCard } from "@/components/logistics/survival-card";
import { useFuelRunway } from "@/hooks/useFuelRunway";
import { nextResupplyDate } from "@/shared/predictions";

const HOUR = 3_600_000;

export default function LogisticsPage() {
  const { stationId, station, snapshot } = useStation();
  const [shipDelay, setShipDelay] = useState(0);
  const [colder, setColder] = useState(0);
  const timestamp = snapshot?.timestamp ?? null;
  const runway = useFuelRunway(stationId, snapshot?.fuelLitres ?? null, timestamp, {
    shipDelayDays: shipDelay,
    tempOffsetC: -colder,
  });
  // Inventory risk only needs hourly precision; avoids re-filtering every 5 s.
  const hour = timestamp === null ? null : Math.floor(timestamp / HOUR) * HOUR;
  const resupply = useMemo(() => (hour === null ? null : nextResupplyDate(hour)), [hour]);

  return (
    <>
      <PageHeader
        title="Logistics"
        description={`${station.name}: diesel runway, supply stock and the annual ISEA resupply.`}
      />
      {!snapshot || hour === null || resupply === null ? (
        <p className="text-sm text-muted-foreground">Connecting to station feed…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <SurvivalCard
            runway={runway}
            fuelLitres={snapshot.fuelLitres}
            shipDelay={shipDelay}
            colder={colder}
            onShipDelay={setShipDelay}
            onColder={setColder}
          />
          {runway && <FuelProjection runway={runway} fuelLitres={snapshot.fuelLitres} now={hour} />}
          <InventoryTable stationId={stationId} resupplyDate={resupply} now={hour} />
        </div>
      )}
    </>
  );
}
