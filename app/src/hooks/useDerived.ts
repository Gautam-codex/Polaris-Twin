import { useEffect, useMemo, useState } from "react";
import { fuelRunway } from "@shared/predictions";
import { getHistory, getSnapshot } from "@shared/simulator";
import type { FuelRunway, StationId, StationSnapshot, WeatherForecastPoint } from "@shared/types";
import { API_BASE } from "@/lib/supabase";

const HOUR = 3_600_000;

/** Fuel runway from the last 24 h of simulated burn, rebuilt once an hour. */
export function useFuelRunway(snapshot: StationSnapshot | null): FuelRunway | null {
  const stationId = snapshot?.stationId ?? null;
  const hour = snapshot ? Math.floor(snapshot.timestamp / HOUR) : null;
  const history = useMemo(() => {
    if (stationId === null || hour === null) return null;
    const end = hour * HOUR;
    return getHistory(stationId, end - 24 * HOUR, end, HOUR);
  }, [stationId, hour]);
  return useMemo(() => (history && snapshot ? fuelRunway(snapshot.fuelLitres, history) : null), [history, snapshot]);
}

/** Hourly forecast from the website API (Open-Meteo), or the simulator when offline. */
export function useForecast(stationId: StationId, hours = 12) {
  const [api, setApi] = useState<{ stationId: StationId; points: WeatherForecastPoint[] } | null>(null);
  const [hourStart] = useState(() => Math.floor(Date.now() / HOUR) * HOUR);

  useEffect(() => {
    let active = true;
    if (!API_BASE) return;
    fetch(`${API_BASE}/api/weather?station=${stationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { forecast?: WeatherForecastPoint[] } | null) => {
        if (active && body?.forecast) setApi({ stationId, points: body.forecast });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [stationId]);

  const simulated = useMemo(
    () =>
      Array.from({ length: hours }, (_, h) => {
        const t = hourStart + h * HOUR;
        const w = getSnapshot(stationId, t).weather;
        return { time: new Date(t).toISOString(), tempC: w.tempC, windKph: w.windKph };
      }),
    [stationId, hours, hourStart],
  );

  const live = api && api.stationId === stationId ? api.points.slice(0, hours) : null;
  return { points: live ?? simulated, source: live ? ("open-meteo" as const) : ("simulated" as const) };
}
