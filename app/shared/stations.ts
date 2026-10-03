import type { Building, Station, StationId } from "./types";

// Crew numbers are approximate public figures and vary every expedition.
export const STATIONS: Record<StationId, Station> = {
  maitri: {
    id: "maitri",
    name: "Maitri",
    region: "Schirmacher Oasis, Queen Maud Land",
    lat: -70.77,
    lon: 11.73,
    established: 1989,
    winterCrew: 25,
    summerCrew: 65,
    description:
      "India's second Antarctic station, on the ice-free Schirmacher Oasis. Fresh water comes from Priyadarshini Lake.",
  },
  bharati: {
    id: "bharati",
    name: "Bharati",
    region: "Larsemann Hills, Prydz Bay",
    lat: -69.41,
    lon: 76.19,
    established: 2012,
    winterCrew: 25,
    summerCrew: 47,
    description:
      "India's newest Antarctic station, built from shipping containers on a coastal promontory in the Larsemann Hills.",
  },
};

export const STATION_IDS: StationId[] = ["maitri", "bharati"];

type BuildingSeed = Omit<Building, "stationId" | "health">;

// Layout on a local grid in metres (x east, z towards the water), within about ±24 m.
// Maitri: long main building on steel stilts, Priyadarshini Lake in front (+z), ice sheet behind (-z).
const MAITRI_BUILDINGS: BuildingSeed[] = [
  { id: "maitri-main", name: "Main Living Block", type: "living", position: [0, 0, -1], size: [24, 7, 8] },
  { id: "maitri-power", name: "Power House", type: "power", position: [-18, 0, -11], size: [8, 5, 6] },
  { id: "maitri-lab", name: "Science Lab", type: "lab", position: [15, 0, -11], size: [8, 4, 6] },
  { id: "maitri-water", name: "Lake Pump House", type: "water", position: [-10, 0, 13], size: [5, 3.5, 5] },
  { id: "maitri-storage", name: "Fuel Farm & Stores", type: "storage", position: [17, 0, 9], size: [9, 4, 6] },
  { id: "maitri-comms", name: "Satellite Comms Mast", type: "comms", position: [-2, 0, -16], size: [3, 10, 3] },
  { id: "maitri-medical", name: "Medical Unit", type: "medical", position: [5, 0, 11], size: [6, 4, 5] },
  { id: "maitri-waste", name: "Waste Incinerator", type: "waste", position: [-20, 0, 6], size: [4, 3, 4] },
];

// Bharati: three-storey block of 134 shipping containers in an aluminium skin, on a headland by the sea (+z).
const BHARATI_BUILDINGS: BuildingSeed[] = [
  { id: "bharati-main", name: "Main Container Block", type: "living", position: [0, 0, 0], size: [30, 9.5, 12] },
  { id: "bharati-power", name: "Power House", type: "power", position: [-15, 0, -14], size: [8, 5, 6] },
  { id: "bharati-lab", name: "Science Lab", type: "lab", position: [9, 0, -14], size: [8, 4, 6] },
  { id: "bharati-water", name: "Sea Water Pump House", type: "water", position: [-18, 0, 12], size: [5, 3.5, 5] },
  { id: "bharati-storage", name: "Fuel Farm & Stores", type: "storage", position: [17, 0, 12], size: [9, 4, 6] },
  { id: "bharati-comms", name: "Satellite Comms Mast", type: "comms", position: [21, 0, -11], size: [3, 12, 3] },
  { id: "bharati-medical", name: "Medical Unit", type: "medical", position: [1, 0, 14], size: [6, 4, 5] },
  { id: "bharati-waste", name: "Waste Incinerator", type: "waste", position: [22, 0, 1], size: [3.5, 3, 3.5] },
];

function withStation(stationId: StationId, seeds: BuildingSeed[]): Building[] {
  return seeds.map((seed) => ({ ...seed, stationId, health: "ok" }));
}

export const BUILDINGS: Record<StationId, Building[]> = {
  maitri: withStation("maitri", MAITRI_BUILDINGS),
  bharati: withStation("bharati", BHARATI_BUILDINGS),
};

export const GENERATOR_CAPACITY_KW = 250;

export const GENERATOR_IDS = ["dg-1", "dg-2", "dg-3"] as const;

/**
 * Fuel in the tanks right after the annual resupply (litres). Sized so a normal
 * year ends with roughly two months in reserve; a long ship delay plus a cold
 * spell can still run it short.
 */
export const SEASON_START_FUEL: Record<StationId, number> = {
  maitri: 500_000,
  bharati: 440_000,
};

/** Approximate crew on station at a given time (summer = Nov-Mar). */
export function crewAt(stationId: StationId, timestampMs: number): number {
  const month = new Date(timestampMs).getUTCMonth();
  const summer = month >= 10 || month <= 2;
  const station = STATIONS[stationId];
  return summer ? station.summerCrew : station.winterCrew;
}
