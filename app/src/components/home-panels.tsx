import { StyleSheet, View } from "react-native";
import { Big, Card, CardTitle, Muted, Tag } from "@/components/ui";
import { colors, healthColor, healthLabel, space } from "@/lib/theme";
import { formatNumber } from "@shared/alerts";
import { safetyIndex } from "@shared/predictions";
import type { Building, FuelRunway, StationSnapshot } from "@shared/types";

function Stat({ title, value, note, color }: { title: string; value: string; note: string; color?: string }) {
  return (
    <Card style={styles.stat}>
      <Muted>{title}</Muted>
      <Big style={[{ marginTop: 4 }, color ? { color } : null]}>{value}</Big>
      <Muted numberOfLines={2} style={{ marginTop: 2 }}>
        {note}
      </Muted>
    </Card>
  );
}

export function StatGrid({ snapshot, runway }: { snapshot: StationSnapshot; runway: FuelRunway | null }) {
  const safety = safetyIndex(snapshot.weather);
  const safetyColor = safety.label === "Safe" ? colors.success : safety.label === "Caution" ? colors.warning : colors.danger;
  return (
    <View style={styles.grid}>
      <Stat
        title="Fuel runway"
        value={runway ? `${Math.floor(runway.daysLeft)} d` : "…"}
        note={runway ? `${Math.round(runway.marginDays)} d spare at resupply` : "Calculating"}
        color={runway && runway.marginDays < 0 ? colors.danger : undefined}
      />
      <Stat
        title="Power load"
        value={`${Math.round(snapshot.energy.totalLoadKw)} kW`}
        note={`Diesel ${Math.round(snapshot.energy.dieselKw)} · battery ${Math.round(snapshot.energy.batteryPct)}%`}
      />
      <Stat
        title="Outside"
        value={`${snapshot.weather.tempC.toFixed(1)}°`}
        note={`Wind chill ${Math.round(snapshot.weather.windChillC)}° · ${Math.round(snapshot.weather.windKph)} km/h`}
      />
      <Stat title="Safety index" value={`${safety.score}`} note={safety.label} color={safetyColor} />
    </View>
  );
}

/** Live readings for a building tapped on the site map. */
export function BuildingReadings({ building, snapshot }: { building: Building; snapshot: StationSnapshot }) {
  const { energy, weather } = snapshot;
  const rows: [string, string][] =
    building.type === "power"
      ? energy.generators.map((g) => [g.name, g.running ? `${Math.round(g.loadKw)} kW · ${g.coolantTempC.toFixed(0)} °C · ${g.vibrationMm.toFixed(1)} mm/s` : "Standby"])
      : building.type === "storage"
        ? [["Diesel stock", `${formatNumber(snapshot.fuelLitres)} L`]]
        : building.type === "water"
          ? [["Water stored", `${formatNumber(snapshot.waterLitres)} L`]]
          : building.type === "comms"
            ? [
                ["Wind at mast", `${Math.round(weather.windKph)} km/h`],
                ["Visibility", `${weather.visibilityKm} km`],
              ]
            : building.type === "waste"
              ? [["Incinerator", "Normal operation"]]
              : [
                  ["Heating demand", `${Math.round(energy.heatingDemandKw)} kW`],
                  ["Battery backup", `${Math.round(energy.batteryPct)}%`],
                ];
  return (
    <View style={styles.readings}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Muted style={{ fontWeight: "600", color: colors.text }}>{building.name}</Muted>
        <Tag label={healthLabel[building.health]} color={healthColor[building.health]} />
      </View>
      {rows.map(([k, v]) => (
        <View key={k} style={styles.row}>
          <Muted>{k}</Muted>
          <Muted style={{ color: colors.text, flexShrink: 1, textAlign: "right" }}>{v}</Muted>
        </View>
      ))}
    </View>
  );
}

export function HealthHeader({ snapshot }: { snapshot: StationSnapshot }) {
  return <CardTitle right={<Tag label={`Station ${healthLabel[snapshot.overallHealth]}`} color={healthColor[snapshot.overallHealth]} />}>Station health</CardTitle>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  stat: { flexBasis: "47%", flexGrow: 1, padding: space.md },
  readings: { marginTop: space.md, padding: space.md, borderRadius: 8, backgroundColor: colors.accent, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: space.md },
});
