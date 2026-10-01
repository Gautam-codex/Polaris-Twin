// Daylight hours from latitude and date (NOAA-style approximation).

const DEG = Math.PI / 180;

/** Solar declination in degrees for a UTC timestamp. */
function declination(timestampMs: number): number {
  const d = new Date(timestampMs);
  const dayOfYear = (timestampMs - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86_400_000;
  return -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10));
}

/**
 * Hours of daylight: 2 * hour angle / 15, where cos(hour angle) =
 * (sin(-0.833°) - sin(lat) sin(decl)) / (cos(lat) cos(decl)); 0 = polar night, 24 = midnight sun.
 */
export function daylightHours(latDeg: number, timestampMs: number): number {
  const lat = latDeg * DEG;
  const decl = declination(timestampMs) * DEG;
  const cosH = (Math.sin(-0.833 * DEG) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
  if (cosH >= 1) return 0;
  if (cosH <= -1) return 24;
  return (2 * Math.acos(cosH)) / DEG / 15;
}

export interface PolarPeriod {
  /** ISO date (YYYY-MM-DD) of the first day of the period. */
  start: string;
  end: string;
  days: number;
}

/**
 * Longest run of polar night (no sunrise) in the given year, and of midnight sun
 * (no sunset) in the summer that starts that year (July to June, so it can cross New Year).
 */
export function polarPeriods(latDeg: number, year: number): { night: PolarPeriod | null; midnightSun: PolarPeriod | null } {
  const DAY = 86_400_000;
  const find = (test: (h: number) => boolean, from: number, to: number): PolarPeriod | null => {
    let best: { from: number; to: number } | null = null;
    let run: { from: number; to: number } | null = null;
    for (let t = from; t < to; t += DAY) {
      if (test(daylightHours(latDeg, t + DAY / 2))) {
        run = run ? { from: run.from, to: t } : { from: t, to: t };
        if (!best || run.to - run.from > best.to - best.from) best = { ...run };
      } else {
        run = null;
      }
    }
    if (!best) return null;
    const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
    return { start: iso(best.from), end: iso(best.to), days: Math.round((best.to - best.from) / DAY) + 1 };
  };
  return {
    night: find((h) => h === 0, Date.UTC(year, 0, 1), Date.UTC(year + 1, 0, 1)),
    midnightSun: find((h) => h === 24, Date.UTC(year, 6, 1), Date.UTC(year + 1, 6, 1)),
  };
}
