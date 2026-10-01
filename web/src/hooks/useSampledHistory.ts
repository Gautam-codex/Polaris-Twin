"use client";

import { useMemo } from "react";
import { getHistory } from "@/shared/simulator";
import type { StationId, StationSnapshot } from "@/shared/types";

/**
 * Simulated history ending at the current step, `spanMs` long, one point every `stepMs`.
 * Recomputed only when the clock crosses into a new step.
 * Pass `version` to force a rebuild (e.g. after injecting a fault).
 */
export function useSampledHistory(
  stationId: StationId,
  timestamp: number | null,
  spanMs: number,
  stepMs: number,
  version = 0,
): StationSnapshot[] {
  const step = timestamp === null ? null : Math.floor(timestamp / stepMs);
  return useMemo(() => {
    if (step === null) return [];
    const end = step * stepMs;
    // `version` is read so the memo rebuilds when it changes.
    return version >= 0 ? getHistory(stationId, end - spanMs, end, stepMs) : [];
  }, [stationId, step, spanMs, stepMs, version]);
}
