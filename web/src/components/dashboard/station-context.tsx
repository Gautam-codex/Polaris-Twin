"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStationSnapshot, type StationSnapshotState } from "@/hooks/useStationSnapshot";
import { STATIONS } from "@/shared/stations";
import type { Station, StationId } from "@/shared/types";

interface StationContextValue extends StationSnapshotState {
  stationId: StationId;
  station: Station;
  setStation: (id: StationId) => void;
  /** Adds the current ?station= to a dashboard link. */
  withStation: (href: string) => string;
}

const StationContext = createContext<StationContextValue | null>(null);

export function parseStation(value: string | null): StationId {
  return value === "bharati" ? "bharati" : "maitri";
}

/** Selected station (from ?station=) plus its live simulated snapshot. Wrap in <Suspense>. */
export function StationProvider({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const stationId = parseStation(params.get("station"));
  const live = useStationSnapshot(stationId);

  const setStation = useCallback(
    (id: StationId) => {
      const next = new URLSearchParams(params.toString());
      next.set("station", id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const withStation = useCallback((href: string) => `${href}?station=${stationId}`, [stationId]);

  const value = useMemo(
    () => ({ ...live, stationId, station: STATIONS[stationId], setStation, withStation }),
    [live, stationId, setStation, withStation],
  );

  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStation(): StationContextValue {
  const value = useContext(StationContext);
  if (!value) throw new Error("useStation must be used inside <StationProvider>");
  return value;
}
