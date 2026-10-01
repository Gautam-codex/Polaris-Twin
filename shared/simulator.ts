// Deterministic, time-seeded station simulator. The same station and time
// always produce the same snapshot, so every viewer sees identical values.
import { applyBuildingHealth, systemHealth, thresholdAlerts, worstHealth } from "./alerts";
import {
  DAY,
  averageDayWeather,
  dieselBurnLph,
  simulateEnergy,
  simulateWeather,
  windChill,
  visibilityFor,
  type GeneratorFault,
} from "./environment";
import { inventorySeeds } from "./inventory";
import { hashString, mulberry32, round, smoothNoise } from "./random";
import { BUILDINGS, SEASON_START_FUEL } from "./stations";
import type { InventoryItem, StationId, StationSnapshot, WeatherSnapshot } from "./types";

const BUCKET_MS = 5_000;

function toBucket(timestampMs: number): number {
  return Math.floor(timestampMs / BUCKET_MS) * BUCKET_MS;
}

// ---- Demo controls (module state, per browser tab / app instance) ----

const faults = new Map<StationId, GeneratorFault>();

interface WeatherOverride {
  weather: Partial<WeatherSnapshot>;
  startMs: number;
  endMs: number;
}
const weatherOverrides = new Map<StationId, WeatherOverride>();

/** Start a generator fault (coolant and vibration climb over 2 minutes), or clear it with null. */
export function setFault(stationId: StationId, generatorId: string | null, startMs: number = Date.now()): void {
  if (generatorId === null) faults.delete(stationId);
  else faults.set(stationId, { generatorId, startMs: toBucket(startMs) });
}

export function getFault(stationId: StationId): GeneratorFault | null {
  return faults.get(stationId) ?? null;
}

/** Force weather values (e.g. a demo blizzard) for `durationMs`, or clear with null. */
export function setWeatherOverride(
  stationId: StationId,
  weather: Partial<WeatherSnapshot> | null,
  durationMs = 0,
  startMs: number = Date.now(),
): void {
  if (weather === null) weatherOverrides.delete(stationId);
  else weatherOverrides.set(stationId, { weather, startMs: toBucket(startMs), endMs: startMs + durationMs });
}

// ---- Season and fuel ----

/** Midnight UTC on the most recent 1 December at or before t (the annual resupply). */
export function seasonStart(timestampMs: number): number {
  const d = new Date(timestampMs);
  const year = d.getUTCMonth() === 11 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return Date.UTC(year, 11, 1);
}

const dailyBurnCache = new Map<string, number>();

/** Litres burned on one day, from that day's average weather (no noise). */
function dailyBurn(stationId: StationId, dayStartMs: number): number {
  const key = `${stationId}:${dayStartMs}`;
  const cached = dailyBurnCache.get(key);
  if (cached !== undefined) return cached;
  const weather = averageDayWeather(stationId, dayStartMs);
  let litres = 0;
  for (let h = 0; h < 24; h += 6) {
    const t = dayStartMs + h * 3_600_000;
    const energy = simulateEnergy(stationId, t, weather, () => 0.5, null);
    litres += dieselBurnLph(energy.dieselKw) * 6;
  }
  dailyBurnCache.set(key, litres);
  return litres;
}

/** Diesel in the tanks: the season-start stock minus each day's burn so far. */
export function fuelAt(stationId: StationId, timestampMs: number): number {
  const start = seasonStart(timestampMs);
  let fuel = SEASON_START_FUEL[stationId];
  let day = start;
  while (day + DAY <= timestampMs) {
    fuel -= dailyBurn(stationId, day);
    day += DAY;
  }
  fuel -= dailyBurn(stationId, day) * ((timestampMs - day) / DAY);
  return Math.max(0, fuel);
}

const WATER: Record<StationId, { base: number; swing: number }> = {
  maitri: { base: 45_000, swing: 10_000 },
  bharati: { base: 30_000, swing: 8_000 },
};

// ---- Snapshot ----

function applyOverride(base: WeatherSnapshot, override: Partial<WeatherSnapshot>, source: WeatherSnapshot["source"]): WeatherSnapshot {
  const merged = { ...base, ...override };
  const tempC = merged.tempC;
  const windKph = merged.windKph;
  return {
    tempC,
    windKph,
    windChillC: override.windChillC ?? round(windChill(tempC, windKph)),
    visibilityKm: override.visibilityKm ?? round(visibilityFor(windKph), 2),
    snowCm: merged.snowCm,
    source: override.source ?? source,
  };
}

/**
 * Snapshot of a station at a moment. `weatherOverride` merges real weather
 * (e.g. from Open-Meteo) over the simulated values.
 */
export function getSnapshot(
  stationId: StationId,
  timestampMs: number,
  weatherOverride?: Partial<WeatherSnapshot>,
): StationSnapshot {
  const t = toBucket(timestampMs);
  const jitter = mulberry32(hashString(`${stationId}:${t}`));

  let weather = simulateWeather(stationId, t, jitter);
  if (weatherOverride) weather = applyOverride(weather, weatherOverride, "open-meteo");
  const demo = weatherOverrides.get(stationId);
  if (demo && t >= demo.startMs && t < demo.endMs) weather = applyOverride(weather, demo.weather, weather.source);

  const energy = simulateEnergy(stationId, t, weather, jitter, getFault(stationId));
  const fuelLitres = round(fuelAt(stationId, t), 0);
  const water = WATER[stationId];
  const waterLitres = round(water.base + water.swing * (smoothNoise(`${stationId}:water`, t, 12 * 3_600_000) - 0.5), 0);

  const readings = { energy, weather, fuelLitres, waterLitres };
  const health = systemHealth(readings);
  const buildings = applyBuildingHealth(BUILDINGS[stationId], health);
  const alerts = thresholdAlerts(stationId, t, readings);
  const overallHealth = worstHealth([
    ...buildings.map((b) => b.health),
    ...alerts.map((a) => (a.severity === "info" ? "ok" : a.severity)),
  ]);

  return { stationId, timestamp: t, buildings, energy, weather, fuelLitres, waterLitres, alerts, overallHealth };
}

/** Snapshots from `fromMs` to `toMs` inclusive, every `stepMs` (minimum 5 s). */
export function getHistory(stationId: StationId, fromMs: number, toMs: number, stepMs: number): StationSnapshot[] {
  const step = Math.max(BUCKET_MS, stepMs);
  const points: StationSnapshot[] = [];
  for (let t = fromMs; t <= toMs; t += step) points.push(getSnapshot(stationId, t));
  return points;
}

/** Stock levels at a moment: stocked on 1 December, then drawn down daily. */
export function getInventory(stationId: StationId, timestampMs: number): InventoryItem[] {
  const days = (timestampMs - seasonStart(timestampMs)) / DAY;
  return inventorySeeds(stationId).map((seed) => ({
    id: `${stationId}-${seed.key}`,
    stationId,
    name: seed.name,
    category: seed.category,
    quantity: round(Math.max(0, seed.startQuantity - seed.dailyUse * days), 0),
    unit: seed.unit,
    dailyUse: round(seed.dailyUse, 2),
    minLevel: round(seed.minLevel, 0),
  }));
}
