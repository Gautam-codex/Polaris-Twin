"use client";

import { useEffect, useState } from "react";
import type { StationId, WeatherResponse } from "@/shared/types";

const REFRESH_MS = 10 * 60_000;

/** Current weather plus the 48 h forecast from /api/weather (null until loaded or on failure). */
export function useWeatherForecast(stationId: StationId): WeatherResponse | null {
  const [data, setData] = useState<{ stationId: StationId; weather: WeatherResponse } | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/weather?station=${stationId}`);
        if (!res.ok) return;
        const weather = (await res.json()) as WeatherResponse;
        if (active) setData({ stationId, weather });
      } catch {
        // Keep the last good forecast; the page falls back to simulated values.
      }
    };
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [stationId]);

  return data && data.stationId === stationId ? data.weather : null;
}
