"use client";

import { useMemo } from "react";
import { useStation } from "@/components/dashboard/station-context";
import { useAlerts, useInventory } from "@/hooks/useSupabaseList";
import { useSampledHistory } from "@/hooks/useSampledHistory";
import { detectAnomalies, fuelRunway, itemsAtRisk, nextResupplyDate, safetyIndex } from "@/shared/predictions";
import type { CopilotRequest } from "@/shared/types";

const MINUTE = 60_000;

export type CopilotContext = Omit<CopilotRequest, "question" | "language" | "history">;

/** Everything the copilot needs about the selected station, built from live data. */
export function useCopilotContext(): CopilotContext | null {
  const { stationId, snapshot } = useStation();
  const timestamp = snapshot?.timestamp ?? null;
  const day = useSampledHistory(stationId, timestamp, 24 * 60 * MINUTE, 30 * MINUTE);
  const recent = useSampledHistory(stationId, timestamp, 30 * MINUTE, 30_000);
  const inventory = useInventory(stationId);
  const stored = useAlerts(stationId);

  return useMemo(() => {
    if (!snapshot || day.length === 0) return null;
    const runway = fuelRunway(snapshot.fuelLitres, day);
    const scenarios = [
      { label: "Ship 20 days late", options: { shipDelayDays: 20 } },
      { label: "Ship 30 days late", options: { shipDelayDays: 30 } },
      { label: "5 °C colder than now", options: { tempOffsetC: -5 } },
      { label: "Ship 20 days late and 5 °C colder", options: { shipDelayDays: 20, tempOffsetC: -5 } },
    ].map((s) => ({ label: s.label, runway: fuelRunway(snapshot.fuelLitres, day, s.options) }));

    return {
      stationId,
      snapshot,
      fuelRunway: runway,
      fuelScenarios: scenarios,
      safetyIndex: safetyIndex(snapshot.weather),
      atRiskItems: itemsAtRisk(inventory.items, nextResupplyDate(snapshot.timestamp), snapshot.timestamp),
      recentAlerts: [...detectAnomalies(recent), ...snapshot.alerts, ...stored.items].slice(0, 12),
    };
  }, [stationId, snapshot, day, recent, inventory.items, stored.items]);
}
