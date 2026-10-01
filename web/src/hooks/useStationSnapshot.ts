"use client";

import { useEffect, useRef, useState } from "react";
import { getHistory, getSnapshot } from "@/shared/simulator";
import type { StationId, StationSnapshot, WeatherSnapshot } from "@/shared/types";

const TICK_MS = 5_000;
const HISTORY_MS = 10 * 60_000;
const WEATHER_REFRESH_MS = 10 * 60_000;

type LiveWeather = Partial<WeatherSnapshot> | null;

/** Real weather from /api/weather, or null if the route is missing or fails. */
async function fetchWeather(stationId: StationId): Promise<LiveWeather> {
  try {
    const res = await fetch(`/api/weather?station=${stationId}`);
    if (!res.ok) return null;
    return (await res.json()) as Partial<WeatherSnapshot>;
  } catch {
    return null;
  }
}

export interface StationSnapshotState {
  snapshot: StationSnapshot | null;
  /** Snapshots from the last 10 minutes, oldest first, one every 5 s. */
  history: StationSnapshot[];
  loading: boolean;
}

/** Live simulated snapshot for a station, refreshed every 5 s, with 10 minutes of history. */
export function useStationSnapshot(stationId: StationId): StationSnapshotState {
  const [state, setState] = useState<StationSnapshotState>({ snapshot: null, history: [], loading: true });
  const weather = useRef<LiveWeather>(null);

  useEffect(() => {
    let cancelled = false;
    weather.current = null;

    const tick = () => {
      const now = Date.now();
      const snapshot = getSnapshot(stationId, now, weather.current ?? undefined);
      setState((prev) => {
        const sameStation = prev.snapshot?.stationId === stationId;
        const base = sameStation ? prev.history : getHistory(stationId, now - HISTORY_MS, now - TICK_MS, TICK_MS);
        const history = [...base.filter((s) => s.timestamp > now - HISTORY_MS && s.timestamp < snapshot.timestamp), snapshot];
        return { snapshot, history, loading: false };
      });
    };

    const loadWeather = async () => {
      const live = await fetchWeather(stationId);
      if (cancelled) return;
      weather.current = live;
      tick();
    };

    const first = setTimeout(tick, 0);
    const interval = setInterval(tick, TICK_MS);
    void loadWeather();
    const weatherInterval = setInterval(() => void loadWeather(), WEATHER_REFRESH_MS);

    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(interval);
      clearInterval(weatherInterval);
    };
  }, [stationId]);

  return state;
}
