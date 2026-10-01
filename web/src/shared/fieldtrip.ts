// Field trip go / no-go from the hourly forecast.
import { visibilityFor, windChill } from "./environment";
import { safetyIndex } from "./predictions";
import type { WeatherForecastPoint } from "./types";

export interface FieldTripPlan {
  verdict: "Go" | "Caution" | "No-go";
  /** Lowest safety score in the window. */
  minScore: number;
  /** ISO time of the worst hour. */
  worstTime: string | null;
  reasons: string[];
}

/**
 * Go / no-go for a trip: the safety index of every forecast hour in the window,
 * judged by the worst hour (>= 70 Go, >= 40 Caution, else No-go). Solo trips and
 * trips over 10 h are always No-go (buddy and daylight rules).
 */
export function planFieldTrip(
  forecast: WeatherForecastPoint[],
  startMs: number,
  hours: number,
  teamSize: number,
): FieldTripPlan {
  const endMs = startMs + hours * 3_600_000;
  const window = forecast.filter((p) => {
    const t = Date.parse(p.time);
    return t >= startMs - 3_600_000 && t <= endMs;
  });
  const reasons: string[] = [];
  if (teamSize < 2) reasons.push("Buddy rule: field trips need at least 2 people");
  if (hours > 10) reasons.push("Trips over 10 hours need an overnight camp plan");
  if (window.length === 0) {
    reasons.push("No forecast covers this window");
    return { verdict: "No-go", minScore: 0, worstTime: null, reasons };
  }

  let worst = { score: 101, time: window[0].time, reasons: [] as string[] };
  for (const p of window) {
    const index = safetyIndex({
      tempC: p.tempC,
      windKph: p.windKph,
      windChillC: windChill(p.tempC, p.windKph),
      visibilityKm: visibilityFor(p.windKph),
      snowCm: 0,
      source: "open-meteo",
    });
    if (index.score < worst.score) worst = { score: index.score, time: p.time, reasons: index.reasons };
  }
  reasons.push(...worst.reasons);
  const blocked = teamSize < 2 || hours > 10;
  const verdict = blocked || worst.score < 40 ? "No-go" : worst.score < 70 ? "Caution" : "Go";
  return { verdict, minScore: worst.score, worstTime: worst.time, reasons };
}
