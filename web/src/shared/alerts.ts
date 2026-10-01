// Threshold alerts and building health derived from a snapshot's readings.
import type {
  Alert,
  AlertSeverity,
  AlertSystem,
  Building,
  BuildingType,
  EnergySnapshot,
  GeneratorReading,
  Health,
  StationId,
  WeatherSnapshot,
} from "./types";

export const THRESHOLDS = {
  coolantWarnC: 95,
  coolantCriticalC: 105,
  vibrationWarnMm: 5,
  vibrationCriticalMm: 8,
  fuelWarnL: 100_000,
  fuelCriticalL: 40_000,
  windWarnKph: 60,
  windCriticalKph: 80,
  batteryWarnPct: 45,
  waterWarnL: 20_000,
};

/** Thousands separators without Intl, so it behaves the same on Hermes. */
export function formatNumber(value: number): string {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const RANK: Record<Health, number> = { ok: 0, warning: 1, critical: 2 };

export function worstHealth(values: Health[]): Health {
  return values.reduce<Health>((worst, h) => (RANK[h] > RANK[worst] ? h : worst), "ok");
}

function level(value: number, warn: number, critical: number): Health {
  if (value >= critical) return "critical";
  if (value >= warn) return "warning";
  return "ok";
}

export function generatorHealth(g: GeneratorReading): Health {
  return worstHealth([
    level(g.coolantTempC, THRESHOLDS.coolantWarnC, THRESHOLDS.coolantCriticalC),
    level(g.vibrationMm, THRESHOLDS.vibrationWarnMm, THRESHOLDS.vibrationCriticalMm),
  ]);
}

export interface SystemReadings {
  energy: EnergySnapshot;
  weather: WeatherSnapshot;
  fuelLitres: number;
  waterLitres: number;
}

/** Health of each system, keyed by the building type that houses it. */
export function systemHealth(r: SystemReadings): Record<BuildingType, Health> {
  const power = worstHealth(r.energy.generators.map(generatorHealth));
  // Living spaces, labs and the medical unit depend on power for heat.
  const heated: Health = power === "critical" ? "warning" : "ok";
  const fuel = r.fuelLitres <= THRESHOLDS.fuelCriticalL ? "critical" : r.fuelLitres <= THRESHOLDS.fuelWarnL ? "warning" : "ok";
  return {
    power,
    living: heated,
    lab: heated,
    medical: heated,
    water: r.waterLitres < THRESHOLDS.waterWarnL ? "warning" : "ok",
    storage: fuel,
    comms: level(r.weather.windKph, THRESHOLDS.windWarnKph, THRESHOLDS.windCriticalKph),
    waste: "ok",
  };
}

export function applyBuildingHealth(buildings: Building[], health: Record<BuildingType, Health>): Building[] {
  return buildings.map((b) => ({ ...b, health: health[b.type] }));
}

function alert(
  stationId: StationId,
  system: AlertSystem,
  key: string,
  severity: AlertSeverity,
  title: string,
  message: string,
  timestamp: number,
): Alert {
  return { id: `${stationId}-${system}-${key}`, stationId, system, severity, title, message, createdAt: new Date(timestamp).toISOString() };
}

export function thresholdAlerts(stationId: StationId, timestamp: number, r: SystemReadings): Alert[] {
  const alerts: Alert[] = [];
  for (const g of r.energy.generators) {
    const coolant = level(g.coolantTempC, THRESHOLDS.coolantWarnC, THRESHOLDS.coolantCriticalC);
    if (coolant !== "ok") {
      alerts.push(alert(stationId, "power", `${g.id}-coolant`, coolant, `${g.name} overheating`,
        `Coolant at ${g.coolantTempC} °C (limit ${THRESHOLDS.coolantWarnC} °C). Reduce load and inspect the cooling system.`, timestamp));
    }
    const vibration = level(g.vibrationMm, THRESHOLDS.vibrationWarnMm, THRESHOLDS.vibrationCriticalMm);
    if (vibration !== "ok") {
      alerts.push(alert(stationId, "power", `${g.id}-vibration`, vibration, `${g.name} vibration high`,
        `Vibration at ${g.vibrationMm} mm/s (limit ${THRESHOLDS.vibrationWarnMm} mm/s). Check mounts and bearings.`, timestamp));
    }
  }
  if (r.fuelLitres <= THRESHOLDS.fuelWarnL) {
    const severity = r.fuelLitres <= THRESHOLDS.fuelCriticalL ? "critical" : "warning";
    alerts.push(alert(stationId, "fuel", "low", severity, "Diesel stock low",
      `${formatNumber(r.fuelLitres)} L of diesel left. Review the fuel runway.`, timestamp));
  }
  const wind = level(r.weather.windKph, THRESHOLDS.windWarnKph, THRESHOLDS.windCriticalKph);
  if (wind !== "ok") {
    alerts.push(alert(stationId, "weather", "blizzard", wind, "Blizzard conditions",
      `Wind ${r.weather.windKph} km/h, visibility ${r.weather.visibilityKm} km. Restrict outdoor work.`, timestamp));
  }
  if (r.energy.batteryPct < THRESHOLDS.batteryWarnPct) {
    alerts.push(alert(stationId, "power", "battery", "warning", "Battery bank low",
      `Battery at ${r.energy.batteryPct}%. Keep a generator on standby.`, timestamp));
  }
  if (r.waterLitres < THRESHOLDS.waterWarnL) {
    alerts.push(alert(stationId, "water", "low", "warning", "Water tank low",
      `${formatNumber(r.waterLitres)} L in storage. Increase pumping or snow melting.`, timestamp));
  }
  return alerts;
}
