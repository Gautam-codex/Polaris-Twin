"use client";

import { useEffect, useMemo, useState } from "react";
import { getWellbeingTrend } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { StationId, WellbeingTrendPoint } from "@/shared/types";

const DAY = 86_400_000;
/** Rolling window length; each chart point averages every check-in in it. */
export const WINDOW_DAYS = 5;
/** Points with fewer check-ins are hidden so no single answer can be singled out. */
export const MIN_RESPONSES = 3;

export interface RollingPoint {
  date: string;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  responses: number;
}

function weighted(days: WellbeingTrendPoint[], pick: (p: WellbeingTrendPoint) => number): number {
  const n = days.reduce((s, d) => s + d.count, 0);
  return Math.round((days.reduce((s, d) => s + pick(d) * d.count, 0) / n) * 10) / 10;
}

/** Anonymous wellbeing as rolling averages; never exposes a single check-in. */
export function useWellbeing(stationId: StationId, now: number | null, days = 14) {
  const [daily, setDaily] = useState<WellbeingTrendPoint[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getWellbeingTrend(stationId, days + WINDOW_DAYS)
      .then((rows) => {
        if (!active) return;
        setDaily(rows);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load wellbeing data");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [stationId, days]);

  const today = now === null ? null : Math.floor(now / DAY) * DAY;

  const rolling = useMemo<RollingPoint[]>(() => {
    if (today === null) return [];
    return Array.from({ length: days }, (_, i) => {
      const end = today - (days - 1 - i) * DAY;
      const inWindow = daily.filter((d) => {
        const t = Date.parse(`${d.date}T00:00:00Z`);
        return t > end - WINDOW_DAYS * DAY && t <= end;
      });
      const responses = inWindow.reduce((s, d) => s + d.count, 0);
      const date = new Date(end).toISOString().slice(0, 10);
      if (responses < MIN_RESPONSES) return { date, mood: null, energy: null, sleepHours: null, responses };
      return {
        date,
        mood: weighted(inWindow, (d) => d.mood),
        energy: weighted(inWindow, (d) => d.energy),
        sleepHours: weighted(inWindow, (d) => d.sleepHours),
        responses,
      };
    });
  }, [daily, today, days]);

  /** Mood over the last 3 days, only when at least MIN_RESPONSES people checked in. */
  const recentMood = useMemo(() => {
    if (today === null) return null;
    const last3 = daily.filter((d) => Date.parse(`${d.date}T00:00:00Z`) > today - 3 * DAY);
    const responses = last3.reduce((s, d) => s + d.count, 0);
    return { responses, mood: responses >= MIN_RESPONSES ? weighted(last3, (d) => d.mood) : null };
  }, [daily, today]);

  return { rolling, recentMood, loading, error };
}
