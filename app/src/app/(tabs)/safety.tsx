import { View } from "react-native";
import { Text } from "@/components/text";
import { Screen } from "@/components/chrome";
import { FieldTripCard } from "@/components/field-trip-card";
import { Gauge } from "@/components/graphics";
import { Card, CardTitle, Loading, Muted, Tag } from "@/components/ui";
import { useStation } from "@/context/station";
import { useForecast } from "@/hooks/useDerived";
import { useStationSnapshot } from "@/hooks/useStationSnapshot";
import { healthColor, space } from "@/lib/theme";
import { visibilityFor, windChill } from "@shared/environment";
import { safetyIndex } from "@shared/predictions";
import { themedStyles } from "@/context/theme";

function labelColor(label: "Safe" | "Caution" | "Unsafe"): string {
  return label === "Safe" ? healthColor.ok : label === "Caution" ? healthColor.warning : healthColor.critical;
}

export default function SafetyScreen() {
  const styles = useStyles();
  const { stationId } = useStation();
  const { snapshot } = useStationSnapshot(stationId);
  const forecast = useForecast(stationId, 12);

  if (!snapshot) {
    return (
      <Screen>
        <Loading label="Reading weather…" />
      </Screen>
    );
  }

  const safety = safetyIndex(snapshot.weather);
  const strip = forecast.points.map((p) => {
    const s = safetyIndex({ tempC: p.tempC, windKph: p.windKph, windChillC: windChill(p.tempC, p.windKph), visibilityKm: visibilityFor(p.windKph), snowCm: 0, source: "simulated" });
    return { hour: p.time.slice(11, 13), score: s.score, label: s.label };
  });

  return (
    <Screen>
      <Card style={{ alignItems: "center" }}>
        <CardTitle right={<Tag label={safety.label} color={labelColor(safety.label)} />}>Field safety index</CardTitle>
        <Gauge value={safety.score} color={labelColor(safety.label)} size={200} />
        <Text style={styles.score}>{safety.score}</Text>
        <Muted>
          {snapshot.weather.tempC.toFixed(1)}° · wind {Math.round(snapshot.weather.windKph)} km/h · chill {Math.round(snapshot.weather.windChillC)}° · vis {snapshot.weather.visibilityKm} km
        </Muted>
        <View style={{ alignSelf: "stretch", marginTop: space.md, gap: 6 }}>
          {safety.reasons.map((r) => (
            <Muted key={r}>• {r}</Muted>
          ))}
        </View>
      </Card>

      <Card>
        <CardTitle right={<Muted>{forecast.source === "open-meteo" ? "Open-Meteo" : "Simulated"}</Muted>}>Next 12 hours</CardTitle>
        <View style={styles.strip}>
          {strip.map((s) => (
            <View key={s.hour} style={styles.cell}>
              <View style={[styles.bar, { backgroundColor: labelColor(s.label), height: 8 + s.score * 0.4 }]} />
              <Text style={styles.hour}>{s.hour}</Text>
            </View>
          ))}
        </View>
        <Muted style={{ marginTop: space.sm }}>Hour (UTC). Taller and greener is safer.</Muted>
      </Card>

      <FieldTripCard stationId={stationId} verdict={safety.label} />
    </Screen>
  );
}

const useStyles = themedStyles((colors) => ({
  score: { fontSize: 32, fontWeight: "600", color: colors.text, marginTop: -space.xl },
  strip: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 64 },
  cell: { flex: 1, alignItems: "center", gap: 4 },
  bar: { width: "60%", borderRadius: 2 },
  hour: { fontSize: 10, color: colors.muted },
}));
