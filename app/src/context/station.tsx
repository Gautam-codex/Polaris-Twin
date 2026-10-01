import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STATIONS } from "@shared/stations";
import type { Station, StationId } from "@shared/types";

const KEY = "polaris-twin:station";

interface StationContextValue {
  stationId: StationId;
  station: Station;
  setStation: (id: StationId) => void;
}

const StationContext = createContext<StationContextValue | null>(null);

/** The station this phone is working for, remembered between launches. */
export function StationProvider({ children }: { children: ReactNode }) {
  const [stationId, setStationId] = useState<StationId>("maitri");

  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (saved === "maitri" || saved === "bharati") setStationId(saved);
      })
      .catch(() => undefined);
  }, []);

  const setStation = useCallback((id: StationId) => {
    setStationId(id);
    void AsyncStorage.setItem(KEY, id).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ stationId, station: STATIONS[stationId], setStation }), [stationId, setStation]);
  return <StationContext.Provider value={value}>{children}</StationContext.Provider>;
}

export function useStation(): StationContextValue {
  const value = useContext(StationContext);
  if (!value) throw new Error("useStation must be used inside <StationProvider>");
  return value;
}
