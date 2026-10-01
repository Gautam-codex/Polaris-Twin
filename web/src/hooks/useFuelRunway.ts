"use client";

import { useMemo } from "react";
import { fuelRunway, type RunwayOptions } from "@/shared/predictions";
import { getHistory } from "@/shared/simulator";
import type { FuelRunway, StationId } from "@/shared/types";

const HOUR = 3_600_000;

/**
 * Fuel runway from the last 24 h of simulated history (30-minute steps).
 * The history is rebuilt once per hour, not on every 5 s tick.
 */
export function useFuelRunway(
  stationId: StationId,
  fuelLitres: number | null,
  timestamp: number | null,
  options: RunwayOptions = {},
): FuelRunway | null {
  const hour = timestamp === null ? null : Math.floor(timestamp / HOUR);
  const history = useMemo(() => {
    if (hour === null) return null;
    const end = hour * HOUR;
    return getHistory(stationId, end - 24 * HOUR, end, HOUR / 2);
  }, [stationId, hour]);

  const { shipDelayDays, tempOffsetC } = options;
  return useMemo(() => {
    if (!history || fuelLitres === null) return null;
    return fuelRunway(fuelLitres, history, { shipDelayDays, tempOffsetC });
  }, [history, fuelLitres, shipDelayDays, tempOffsetC]);
}
