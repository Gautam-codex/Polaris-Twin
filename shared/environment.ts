// Weather and energy models used by the simulator.
import { GENERATOR_CAPACITY_KW, GENERATOR_IDS, STATIONS } from "./stations";
import { clamp, randomFor, round, smoothNoise } from "./random";
import type { EnergySnapshot, GeneratorReading, StationId, WeatherSnapshot } from "./types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Diesel use per kW of generator load (litres per kWh). */
export const LITRES_PER_KWH = 0.25;
/** Fuel a running generator burns at zero load (litres per hour). */
export const IDLE_BURN_LPH = 4;
/** A second generator starts when diesel load exceeds this. */
const SECOND_GENERATOR_KW = 180;

/** 1 at the coldest point of the year (mid July), -1 at the warmest (mid January). */
export function seasonalCold(timestampMs: number): number {
  const start = Date.UTC(new Date(timestampMs).getUTCFullYear(), 0, 1);
  const dayOfYear = (timestampMs - start) / DAY;
  return Math.cos((2 * Math.PI * (dayOfYear - 196)) / 365.25);
}

/** Local solar hour (0-24) from UTC time and longitude. */
function solarHour(stationId: StationId, timestampMs: number): number {
  const utcHours = (timestampMs % DAY) / HOUR;
  return (utcHours + STATIONS[stationId].lon / 15 + 24) % 24;
}

/** Environment Canada wind chill formula (valid for wind >= 4.8 km/h). */
export function windChill(tempC: number, windKph: number): number {
  if (windKph < 4.8) return tempC;
  const v = windKph ** 0.16;
  return 13.12 + 0.6215 * tempC - 11.37 * v + 0.3965 * tempC * v;
}

/** Visibility falls off exponentially as blowing snow picks up above 20 km/h. */
export function visibilityFor(windKph: number): number {
  return clamp(20 * Math.exp(-Math.max(0, windKph - 20) / 15), 0.1, 20);
}

/** Simulated weather. Bharati is coastal and runs about 2 C milder than Maitri. */
export function simulateWeather(stationId: StationId, t: number, jitter: () => number): WeatherSnapshot {
  const cold = seasonalCold(t);
  const daily = Math.cos((2 * Math.PI * (solarHour(stationId, t) - 14)) / 24);
  const drift = smoothNoise(`${stationId}:temp`, t, 6 * HOUR) - 0.5;
  const offset = stationId === "bharati" ? 2 : 0;
  const tempC = clamp(-20 - 11 * cold + 2.5 * daily + 8 * drift + offset + (jitter() - 0.5) * 0.4, -35, -5);

  const gust = smoothNoise(`${stationId}:wind`, t, 2 * HOUR);
  const storm = smoothNoise(`${stationId}:blizzard`, t, 3 * HOUR);
  const blizzard = storm > 0.82 ? ((storm - 0.82) / 0.18) * 55 : 0;
  const windKph = clamp(14 + 8 * cold + 20 * gust + blizzard + (jitter() - 0.5) * 2, 5, 90);

  const snowCm = clamp(35 + 25 * cold + 15 * (smoothNoise(`${stationId}:snow`, t, 2 * DAY) - 0.5), 5, 90);

  return {
    tempC: round(tempC),
    windKph: round(windKph),
    windChillC: round(windChill(tempC, windKph)),
    visibilityKm: round(visibilityFor(windKph), 2),
    snowCm: round(snowCm),
    source: "simulated",
  };
}

/** Heating rises 4 kW per degree below -5 C plus wind-driven heat loss. */
export function heatingDemand(tempC: number, windKph: number): number {
  return 40 + Math.max(0, -5 - tempC) * 4 + windKph * 0.4;
}

/** Bharati's newer insulated container block draws a little less power. */
const LOAD_SCALE: Record<StationId, number> = { maitri: 1, bharati: 0.92 };

/** Total station load in kW from weather and time of day (120-320 kW). */
export function stationLoad(stationId: StationId, t: number, weather: WeatherSnapshot): number {
  const activity = 15 * Math.sin((2 * Math.PI * (solarHour(stationId, t) - 8)) / 24);
  const raw = 80 + heatingDemand(weather.tempC, weather.windKph) + activity;
  return clamp(raw * LOAD_SCALE[stationId], 120, 320);
}

/** Small wind turbine: starts at 10 km/h, caps at 30 kW, cuts out above 80 km/h. */
function windPower(windKph: number): number {
  if (windKph < 10 || windKph > 80) return 0;
  return Math.min(30, (windKph - 10) * 0.6);
}

/** Solar array: up to 40 kW in summer, zero during the winter polar night. */
function solarPower(stationId: StationId, t: number): number {
  const summer = (1 - seasonalCold(t)) / 2;
  if (summer < 0.15) return 0;
  const sun = 0.35 + 0.65 * Math.max(0, Math.cos((2 * Math.PI * (solarHour(stationId, t) - 12)) / 24));
  return 40 * summer * sun;
}

/** Diesel litres burned per hour for a given diesel load (no noise). */
export function dieselBurnLph(dieselKw: number): number {
  const running = dieselKw > SECOND_GENERATOR_KW ? 2 : 1;
  return running * IDLE_BURN_LPH + dieselKw * LITRES_PER_KWH;
}

export interface GeneratorFault {
  generatorId: string;
  startMs: number;
}

/** Fault ramp: coolant +35 C and vibration +6.5 mm/s, climbing linearly over 2 minutes. */
const FAULT_RAMP_MS = 120_000;

export function simulateEnergy(
  stationId: StationId,
  t: number,
  weather: WeatherSnapshot,
  jitter: () => number,
  fault: GeneratorFault | null,
): EnergySnapshot {
  const totalLoadKw = stationLoad(stationId, t, weather);
  const windKw = windPower(weather.windKph);
  const solarKw = solarPower(stationId, t);
  const dieselKw = Math.max(0, totalLoadKw - windKw - solarKw);
  const runningCount = dieselKw > SECOND_GENERATOR_KW ? 2 : 1;
  const perGenerator = dieselKw / runningCount;

  const generators: GeneratorReading[] = GENERATOR_IDS.map((id, index) => {
    const running = index < runningCount;
    const loadKw = running ? perGenerator : 0;
    const loadFrac = loadKw / GENERATOR_CAPACITY_KW;
    let coolantTempC = running ? 78 + 12 * loadFrac : 35;
    let vibrationMm = running ? 2.2 + 2 * loadFrac : 0;
    coolantTempC += (jitter() - 0.5) * 1.2;
    vibrationMm = Math.max(0, vibrationMm + (running ? (jitter() - 0.5) * 0.3 : 0));
    if (fault && fault.generatorId === id && t >= fault.startMs) {
      const ramp = Math.min(1, (t - fault.startMs) / FAULT_RAMP_MS);
      coolantTempC += 35 * ramp;
      vibrationMm += 6.5 * ramp;
    }
    return {
      id,
      name: `Generator ${index + 1}`,
      loadKw: round(loadKw),
      capacityKw: GENERATOR_CAPACITY_KW,
      coolantTempC: round(coolantTempC),
      vibrationMm: round(vibrationMm, 2),
      fuelBurnLph: running ? round(IDLE_BURN_LPH + loadKw * LITRES_PER_KWH) : 0,
      running,
    };
  });

  const batteryPct = 40 + 55 * smoothNoise(`${stationId}:battery`, t, 4 * HOUR);

  return {
    totalLoadKw: round(totalLoadKw),
    dieselKw: round(dieselKw),
    windKw: round(windKw),
    solarKw: round(solarKw),
    batteryPct: round(batteryPct),
    heatingDemandKw: round(heatingDemand(weather.tempC, weather.windKph)),
    generators,
  };
}

/** Average weather for a whole day without noise, used to integrate fuel use. */
export function averageDayWeather(stationId: StationId, dayStartMs: number): WeatherSnapshot {
  const t = dayStartMs + DAY / 2;
  const offset = stationId === "bharati" ? 2 : 0;
  const tempC = clamp(-20 - 11 * seasonalCold(t) + offset, -35, -5);
  const windKph = 24 + 8 * seasonalCold(t) + 4 * randomFor(`${stationId}:daywind:${dayStartMs}`);
  return {
    tempC,
    windKph,
    windChillC: windChill(tempC, windKph),
    visibilityKm: visibilityFor(windKph),
    snowCm: 35,
    source: "simulated",
  };
}

export { DAY, HOUR };
