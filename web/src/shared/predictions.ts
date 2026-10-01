// Pure prediction functions over simulator output. No state, no dependencies.
import { round } from "./random";
import { crewAt } from "./stations";
import type {
  Alert,
  ComplianceSummary,
  FuelRunway,
  GeneratorHistoryPoint,
  GeneratorReading,
  InventoryItem,
  SafetyIndex,
  StationSnapshot,
  WeatherSnapshot,
} from "./types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Station snapshots or plain generator samples; both carry generator readings. */
export type HistoryPoint = GeneratorHistoryPoint | StationSnapshot;

function gensOf(point: HistoryPoint): GeneratorReading[] {
  return "generators" in point ? point.generators : point.energy.generators;
}

function totalBurnLph(generators: GeneratorReading[]): number {
  return generators.reduce((sum, g) => sum + g.fuelBurnLph, 0);
}

/** Litres burned across a history: sum of (total generator burn L/h x hours to the next point). */
function litresBurned(history: HistoryPoint[]): number {
  let litres = 0;
  for (let i = 0; i < history.length - 1; i++) {
    const hours = (history[i + 1].timestamp - history[i].timestamp) / HOUR;
    litres += totalBurnLph(gensOf(history[i])) * hours;
  }
  return litres;
}

/** Next resupply: midnight UTC on the next 1 December after `now`. */
export function nextResupplyDate(now: Date | number): Date {
  const ms = typeof now === "number" ? now : now.getTime();
  const year = new Date(ms).getUTCFullYear();
  const thisYear = Date.UTC(year, 11, 1);
  return new Date(thisYear > ms ? thisYear : Date.UTC(year + 1, 11, 1));
}

export interface RunwayOptions {
  /** Days the ISEA ship is late. */
  shipDelayDays?: number;
  /** Change in outside temperature, °C; -5 means 5 °C colder than now. */
  tempOffsetC?: number;
}

/**
 * Days of diesel left = litres / burn rate, where burn rate (L/day) is the litres
 * burned over the last 24 h of history scaled to 24 h, increased by 2.5% per °C colder.
 */
export function fuelRunway(fuelLitres: number, history: HistoryPoint[], options: RunwayOptions = {}): FuelRunway {
  if (history.length === 0) throw new Error("fuelRunway needs at least one history point");
  const latest = history[history.length - 1];
  const window = history.filter((p) => p.timestamp >= latest.timestamp - DAY);
  const spanHours = (latest.timestamp - window[0].timestamp) / HOUR;
  const baseLpd = spanHours > 0 ? (litresBurned(window) / spanHours) * 24 : totalBurnLph(gensOf(latest)) * 24;

  const factor = Math.max(0.5, 1 - 0.025 * (options.tempOffsetC ?? 0));
  const burnRateLpd = baseLpd * factor;
  const daysLeft = burnRateLpd > 0 ? fuelLitres / burnRateLpd : Number.POSITIVE_INFINITY;

  const resupplyMs = nextResupplyDate(latest.timestamp).getTime() + (options.shipDelayDays ?? 0) * DAY;
  const daysToResupply = (resupplyMs - latest.timestamp) / DAY;

  return {
    daysLeft: round(daysLeft),
    runoutDate: Number.isFinite(daysLeft) ? isoDate(latest.timestamp + daysLeft * DAY) : "never",
    burnRateLpd: round(burnRateLpd, 0),
    resupplyDate: isoDate(resupplyMs),
    marginDays: round(daysLeft - daysToResupply),
  };
}

type Metric = "coolantTempC" | "vibrationMm";

const METRICS: { key: Metric; label: string; unit: string; minStd: number; action: string }[] = [
  {
    key: "coolantTempC",
    label: "coolant temperature",
    unit: "°C",
    minStd: 0.5,
    action: "Shift load to the standby generator, then check the coolant level, pump and radiator.",
  },
  {
    key: "vibrationMm",
    label: "vibration",
    unit: "mm/s",
    minStd: 0.1,
    action: "Shift load to the standby generator, then inspect the engine mounts, bearings and coupling.",
  },
];

/**
 * z = (latest - mean) / std of the previous 60 points (same running state only);
 * z > 2.5 is a warning and z > 3.5 critical. Works best with 30 s - 1 min steps.
 */
export function detectAnomalies(history: HistoryPoint[]): Alert[] {
  if (history.length < 11) return [];
  const latest = history[history.length - 1];
  const previous = history.slice(-61, -1);
  const alerts: Alert[] = [];

  for (const gen of gensOf(latest)) {
    const baseline = previous
      .map((p) => gensOf(p).find((g) => g.id === gen.id))
      .filter((g): g is GeneratorReading => g !== undefined && g.running === gen.running);
    if (baseline.length < 10) continue;

    for (const metric of METRICS) {
      const values = baseline.map((g) => g[metric.key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      const std = Math.max(Math.sqrt(variance), metric.minStd);
      const z = (gen[metric.key] - mean) / std;
      if (z <= 2.5) continue;

      const severity = z > 3.5 ? "critical" : "warning";
      alerts.push({
        id: `${latest.stationId}-anomaly-${gen.id}-${metric.key}`,
        stationId: latest.stationId,
        system: "power",
        severity,
        title: `${gen.name} ${metric.label} anomaly`,
        message:
          `${gen.name} ${metric.label} is ${gen[metric.key]} ${metric.unit}, ${round(z)} standard deviations ` +
          `above its recent average of ${round(mean)} ${metric.unit}. ${metric.action}`,
        createdAt: new Date(latest.timestamp).toISOString(),
      });
    }
  }
  return alerts;
}

/**
 * Score = 100 - (wind over 40 km/h x 1.2, max 50) - (wind chill below -30 °C x 2, max 30)
 * - (30 if visibility < 1 km, 40 if < 0.2 km), floored at 0.
 */
export function safetyIndex(weather: WeatherSnapshot): SafetyIndex {
  let score = 100;
  const reasons: string[] = [];
  if (weather.windKph > 40) {
    score -= Math.min(50, (weather.windKph - 40) * 1.2);
    reasons.push(`Wind ${weather.windKph} km/h is above the 40 km/h outdoor limit`);
  }
  if (weather.windChillC < -30) {
    score -= Math.min(30, (-30 - weather.windChillC) * 2);
    reasons.push(`Wind chill ${weather.windChillC} °C risks frostbite within minutes`);
  }
  if (weather.visibilityKm < 1) {
    score -= weather.visibilityKm < 0.2 ? 40 : 30;
    reasons.push(`Visibility ${weather.visibilityKm} km; whiteout risk`);
  }
  score = Math.max(0, Math.round(score));
  const label = score >= 70 ? "Safe" : score >= 40 ? "Caution" : "Unsafe";
  if (reasons.length === 0) reasons.push("Conditions within normal outdoor limits");
  return { score, label, reasons };
}

/** Days until empty = quantity / daily use. */
export function inventoryDaysLeft(item: InventoryItem): number {
  return item.dailyUse > 0 ? round(item.quantity / item.dailyUse) : Number.POSITIVE_INFINITY;
}

/** At risk when quantity - daily use x days until resupply falls below the minimum level. */
export function itemsAtRisk(items: InventoryItem[], resupplyDate: Date, now: number = Date.now()): InventoryItem[] {
  const days = Math.max(0, (resupplyDate.getTime() - now) / DAY);
  return items
    .filter((item) => item.quantity - item.dailyUse * days < item.minLevel)
    .sort((a, b) => inventoryDaysLeft(a) - inventoryDaysLeft(b));
}

/**
 * Diesel = litres burned across the history; CO2 = diesel x 2.68 kg/L;
 * waste = crew x 1.8 kg per person per day over the same period.
 */
export function complianceSummary(history: StationSnapshot[]): ComplianceSummary {
  if (history.length < 2) return { co2Tonnes: 0, dieselLitres: 0, wasteKg: 0 };
  const dieselLitres = litresBurned(history);
  let wasteKg = 0;
  for (let i = 0; i < history.length - 1; i++) {
    const days = (history[i + 1].timestamp - history[i].timestamp) / DAY;
    wasteKg += crewAt(history[i].stationId, history[i].timestamp) * 1.8 * days;
  }
  return {
    co2Tonnes: round((dieselLitres * 2.68) / 1000, 2),
    dieselLitres: round(dieselLitres, 0),
    wasteKg: round(wasteKg, 0),
  };
}
