import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/supabase";
import { getSnapshot } from "@shared/simulator";
import type { StationId, StationSnapshot, WeatherSnapshot } from "@shared/types";

const TICK_MS = 10_000;
const WEATHER_MS = 10 * 60_000;

type LiveWeather = Partial<WeatherSnapshot> | null;

async function fetchWeather(stationId: StationId): Promise<LiveWeather> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/api/weather?station=${stationId}`);
    if (!res.ok) return null;
    const body = (await res.json()) as WeatherSnapshot & { forecast?: unknown };
    const { forecast: _forecast, ...weather } = body;
    return weather;
  } catch {
    return null;
  }
}

/** Simulated snapshot every 10 s, with real Open-Meteo weather merged in when the phone is online. */
export function useStationSnapshot(stationId: StationId) {
  const [snapshot, setSnapshot] = useState<StationSnapshot | null>(null);
  const weather = useRef<LiveWeather>(null);

  const tick = useCallback(() => {
    setSnapshot(getSnapshot(stationId, Date.now(), weather.current ?? undefined));
  }, [stationId]);

  const refresh = useCallback(async () => {
    weather.current = await fetchWeather(stationId);
    tick();
  }, [stationId, tick]);

  useEffect(() => {
    weather.current = null;
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, TICK_MS);
    void refresh();
    const weatherId = setInterval(() => void refresh(), WEATHER_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      clearInterval(weatherId);
    };
  }, [tick, refresh]);

  return { snapshot, refresh };
}
