// Smoke test for the shared logic. Run from the repo root: npx tsx shared/test.ts
import {
  complianceSummary,
  detectAnomalies,
  fuelRunway,
  itemsAtRisk,
  nextResupplyDate,
  safetyIndex,
} from "./predictions";
import { getHistory, getInventory, getSnapshot, setFault, setWeatherOverride } from "./simulator";
import { STATION_IDS } from "./stations";
import type { StationSnapshot } from "./types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const now = Date.now();

function summarise(s: StationSnapshot): void {
  const w = s.weather;
  const e = s.energy;
  console.log(`\n=== ${s.stationId.toUpperCase()} @ ${new Date(s.timestamp).toISOString()} — ${s.overallHealth}`);
  console.log(`Weather: ${w.tempC} °C, wind ${w.windKph} km/h, chill ${w.windChillC} °C, vis ${w.visibilityKm} km, snow ${w.snowCm} cm`);
  console.log(`Energy: load ${e.totalLoadKw} kW (diesel ${e.dieselKw}, wind ${e.windKw}, solar ${e.solarKw}), heating ${e.heatingDemandKw} kW, battery ${e.batteryPct}%`);
  for (const g of e.generators) {
    console.log(`  ${g.name}: ${g.running ? "running" : "standby"} ${g.loadKw}/${g.capacityKw} kW, coolant ${g.coolantTempC} °C, vib ${g.vibrationMm} mm/s, ${g.fuelBurnLph} L/h`);
  }
  console.log(`Fuel ${s.fuelLitres} L, water ${s.waterLitres} L`);
  console.log(`Buildings: ${s.buildings.map((b) => `${b.name}=${b.health}`).join(", ")}`);
  console.log(`Alerts: ${s.alerts.length ? s.alerts.map((a) => `[${a.severity}] ${a.title}`).join("; ") : "none"}`);
  const safety = safetyIndex(w);
  console.log(`Safety: ${safety.score} ${safety.label} — ${safety.reasons.join("; ")}`);
}

for (const id of STATION_IDS) {
  const snap = getSnapshot(id, now);
  summarise(snap);

  const dayHistory = getHistory(id, now - 24 * HOUR, now, 15 * MINUTE);
  console.log("Fuel runway:", fuelRunway(snap.fuelLitres, dayHistory));
  console.log("Fuel runway, ship 20 days late:", fuelRunway(snap.fuelLitres, dayHistory, { shipDelayDays: 20 }));
  console.log("Fuel runway, 5 °C colder:", fuelRunway(snap.fuelLitres, dayHistory, { tempOffsetC: -5 }));
  console.log("Last 24 h:", complianceSummary(dayHistory));

  const risk = itemsAtRisk(getInventory(id, now), nextResupplyDate(now), now);
  console.log(`Inventory at risk before ${nextResupplyDate(now).toISOString().slice(0, 10)}:`,
    risk.length ? risk.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(", ") : "none");
}

console.log("\n=== FAULT: Maitri Generator 1, simulating 3 minutes");
setFault("maitri", "dg-1", now);
for (const minutes of [0, 1, 2, 3]) {
  const t = now + minutes * MINUTE;
  const history = getHistory("maitri", t - 30 * MINUTE, t, 30_000);
  const g1 = history[history.length - 1].energy.generators[0];
  const anomalies = detectAnomalies(history);
  console.log(`+${minutes} min: coolant ${g1.coolantTempC} °C, vib ${g1.vibrationMm} mm/s, ${anomalies.length} anomaly alert(s)`);
  for (const a of anomalies) console.log(`  [${a.severity}] ${a.title}: ${a.message}`);
}
console.log("Threshold alerts at +3 min:", getSnapshot("maitri", now + 3 * MINUTE).alerts.map((a) => `[${a.severity}] ${a.title}`));
setFault("maitri", null);

console.log("\n=== DEMO BLIZZARD on Bharati");
setWeatherOverride("bharati", { windKph: 85, tempC: -28 }, 10 * MINUTE, now);
summarise(getSnapshot("bharati", now));
setWeatherOverride("bharati", null);

const bucket = Math.floor(now / 5000) * 5000;
const same = JSON.stringify(getSnapshot("maitri", bucket)) === JSON.stringify(getSnapshot("maitri", bucket + 4_999));
console.log("\n=== Determinism:", same ? "same 5 s bucket gives an identical snapshot" : "MISMATCH");
