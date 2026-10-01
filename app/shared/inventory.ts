// Supply catalogue. Quantities are stocked at the 1 December resupply and
// drawn down at a steady daily rate. Figures are illustrative, not NCPOR data.
import type { InventoryCategory, StationId } from "./types";

export interface InventorySeed {
  key: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  /** Quantity right after resupply. */
  startQuantity: number;
  dailyUse: number;
  minLevel: number;
}

const COMMON: InventorySeed[] = [
  { key: "atf", name: "Aviation turbine fuel (helicopters)", category: "fuel", unit: "L", startQuantity: 60_000, dailyUse: 120, minLevel: 5_000 },
  { key: "petrol", name: "Petrol for snow vehicles", category: "fuel", unit: "L", startQuantity: 25_000, dailyUse: 70, minLevel: 2_000 },
  { key: "rice", name: "Rice", category: "food", unit: "kg", startQuantity: 9_000, dailyUse: 22, minLevel: 500 },
  { key: "meat", name: "Frozen meat", category: "food", unit: "kg", startQuantity: 6_000, dailyUse: 18, minLevel: 400 },
  { key: "milk", name: "Milk powder", category: "food", unit: "kg", startQuantity: 2_500, dailyUse: 6, minLevel: 150 },
  { key: "antibiotics", name: "Antibiotic courses", category: "medical", unit: "courses", startQuantity: 400, dailyUse: 0.6, minLevel: 40 },
  { key: "oxygen", name: "Medical oxygen cylinders", category: "medical", unit: "cylinders", startQuantity: 120, dailyUse: 0.25, minLevel: 15 },
  { key: "filters", name: "Generator oil filters", category: "spares", unit: "pcs", startQuantity: 120, dailyUse: 0.35, minLevel: 10 },
  { key: "ln2", name: "Liquid nitrogen", category: "science", unit: "L", startQuantity: 8_000, dailyUse: 20, minLevel: 500 },
];

/** Bharati has a smaller crew, so it stocks and uses about 80% as much. */
const SCALE: Record<StationId, number> = { maitri: 1, bharati: 0.8 };

export function inventorySeeds(stationId: StationId): InventorySeed[] {
  const scale = SCALE[stationId];
  return COMMON.map((seed) => ({
    ...seed,
    startQuantity: seed.startQuantity * scale,
    dailyUse: seed.dailyUse * scale,
    minLevel: seed.minLevel * scale,
  }));
}
