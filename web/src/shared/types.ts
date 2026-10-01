// Shared domain types for Polaris Twin. Pure TypeScript, no dependencies.

export type StationId = "maitri" | "bharati";

export type Health = "ok" | "warning" | "critical";

export interface Station {
  id: StationId;
  name: string;
  region: string;
  lat: number;
  lon: number;
  established: number;
  winterCrew: number;
  summerCrew: number;
  description: string;
}

export type BuildingType =
  | "living"
  | "power"
  | "lab"
  | "water"
  | "storage"
  | "comms"
  | "medical"
  | "waste";

export interface Building {
  id: string;
  stationId: StationId;
  name: string;
  type: BuildingType;
  /** Footprint centre at ground level, metres: [x, y, z]. */
  position: [number, number, number];
  /** Width (x), height (y), depth (z) in metres. */
  size: [number, number, number];
  health: Health;
}

export interface GeneratorReading {
  id: string;
  name: string;
  loadKw: number;
  capacityKw: number;
  coolantTempC: number;
  /** Vibration velocity, mm/s RMS. */
  vibrationMm: number;
  fuelBurnLph: number;
  running: boolean;
}

export interface EnergySnapshot {
  totalLoadKw: number;
  dieselKw: number;
  windKw: number;
  solarKw: number;
  batteryPct: number;
  heatingDemandKw: number;
  generators: GeneratorReading[];
}

export type InventoryCategory = "fuel" | "food" | "medical" | "spares" | "science";

export interface InventoryItem {
  id: string;
  stationId: StationId;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  dailyUse: number;
  minLevel: number;
}

export interface WeatherSnapshot {
  tempC: number;
  windKph: number;
  windChillC: number;
  visibilityKm: number;
  snowCm: number;
  source: "open-meteo" | "simulated";
}

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertSystem = "power" | "fuel" | "weather" | "water" | "comms" | "inventory";

export interface Alert {
  id: string;
  stationId: StationId;
  system: AlertSystem;
  severity: AlertSeverity;
  title: string;
  message: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

export interface StationSnapshot {
  stationId: StationId;
  /** Unix time in milliseconds, rounded to 5 s. */
  timestamp: number;
  buildings: Building[];
  energy: EnergySnapshot;
  weather: WeatherSnapshot;
  fuelLitres: number;
  waterLitres: number;
  alerts: Alert[];
  overallHealth: Health;
}

/** One sample of all generators at a station, used for anomaly detection. */
export interface GeneratorHistoryPoint {
  stationId: StationId;
  timestamp: number;
  generators: GeneratorReading[];
}

export interface FuelRunway {
  daysLeft: number;
  /** ISO date (YYYY-MM-DD) when fuel runs out at the current burn rate. */
  runoutDate: string;
  burnRateLpd: number;
  /** ISO date of the expected resupply, including any ship delay. */
  resupplyDate: string;
  /** Days of fuel left over when the ship arrives; negative means a shortfall. */
  marginDays: number;
}

export interface SafetyIndex {
  /** 0-100, higher is safer. */
  score: number;
  label: "Safe" | "Caution" | "Unsafe";
  reasons: string[];
}

export interface ComplianceSummary {
  co2Tonnes: number;
  dieselLitres: number;
  wasteKg: number;
}
