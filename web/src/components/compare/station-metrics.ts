"use client";

import { useMemo } from "react";
import { useFuelRunway } from "@/hooks/useFuelRunway";
import { useAlerts } from "@/hooks/useSupabaseList";
import { useWellbeing } from "@/hooks/useWellbeing";
import { complianceSummary, safetyIndex } from "@/shared/predictions";
import { getHistory } from "@/shared/simulator";
import type { Health, StationId, StationSnapshot } from "@/shared/types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export interface StationMetrics {
  health: Health | null;
  runwayDays: number | null;
  marginDays: number | null;
  loadKw: number | null;
  safety: number | null;
  wellbeing: number | null;
  co2Tonnes: number | null;
  openAlerts: number | null;
}

/** All compare-page metrics for one station. */
export function useStationMetrics(stationId: StationId, snapshot: StationSnapshot | null): StationMetrics {
  const timestamp = snapshot?.timestamp ?? null;
  const runway = useFuelRunway(stationId, snapshot?.fuelLitres ?? null, timestamp);
  const alerts = useAlerts(stationId);
  const { rolling } = useWellbeing(stationId, timestamp);
  const day = timestamp === null ? null : Math.floor(timestamp / DAY) * DAY;
  const co2 = useMemo(
    () => (day === null ? null : complianceSummary(getHistory(stationId, day - 30 * DAY, day, 2 * HOUR)).co2Tonnes),
    [stationId, day],
  );

  const shown = rolling.filter((p) => p.mood !== null);
  const wellbeing = shown.length ? Math.round((shown.reduce((s, p) => s + (p.mood ?? 0), 0) / shown.length) * 10) / 10 : null;

  return {
    health: snapshot?.overallHealth ?? null,
    runwayDays: runway?.daysLeft ?? null,
    marginDays: runway?.marginDays ?? null,
    loadKw: snapshot?.energy.totalLoadKw ?? null,
    safety: snapshot ? safetyIndex(snapshot.weather).score : null,
    wellbeing,
    co2Tonnes: co2,
    openAlerts: snapshot && !alerts.loading ? alerts.items.filter((a) => !a.acknowledged).length + snapshot.alerts.length : null,
  };
}
