import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Big, Body, Button, Card, CardTitle, Chip, Muted, Tag } from "@/components/ui";
import { useFieldTrip } from "@/hooks/useFieldTrip";
import { colors, radius, space, tint } from "@/lib/theme";
import type { StationId } from "@shared/types";

const DESTINATIONS: Record<StationId, string[]> = {
  maitri: ["Priyadarshini Lake", "Oasis ridge survey site", "Ice shelf edge (vehicle)"],
  bharati: ["Coastal sampling point", "Larsemann Hills ridge", "Inland ice plateau (vehicle)"],
};
const HOURS = [1, 2, 4, 6, 8];

function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(Math.abs(ms) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** "Going outside" check-out with a return countdown; turns red when the team is overdue. */
export function FieldTripCard({ stationId, verdict }: { stationId: StationId; verdict: "Safe" | "Caution" | "Unsafe" }) {
  const { trip, now, overdue, start, end } = useFieldTrip();
  const [destination, setDestination] = useState(DESTINATIONS[stationId][0]);
  const [team, setTeam] = useState("");
  const [hours, setHours] = useState(2);

  if (trip) {
    const left = trip.returnBy - now;
    return (
      <Card style={overdue ? { borderColor: colors.danger, backgroundColor: tint(colors.danger, 0.06) } : undefined}>
        <CardTitle right={<Tag label={overdue ? "OVERDUE" : "OUTSIDE"} color={overdue ? colors.danger : colors.primary} />}>Field team out</CardTitle>
        <Body style={{ fontWeight: "600" }}>{trip.team}</Body>
        <Muted>
          {trip.destination} · due back {new Date(trip.returnBy).toISOString().slice(11, 16)} UTC
        </Muted>
        <Big style={{ marginTop: space.md, color: overdue ? colors.danger : colors.text }}>
          {overdue ? `+${countdown(left)}` : countdown(left)}
        </Big>
        <Muted>{overdue ? "Overdue. Alert sent to the station and NCPOR. Follow SOP 1." : "Time until expected return"}</Muted>
        <Button
          label="Team is back inside"
          onPress={() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            end();
          }}
          style={{ marginTop: space.md }}
        />
      </Card>
    );
  }

  return (
    <Card style={{ gap: space.md }}>
      <CardTitle>Going outside</CardTitle>
      {verdict === "Unsafe" && <Muted style={{ color: colors.danger }}>Conditions are unsafe right now. Only go out for an emergency.</Muted>}
      <View style={{ gap: 6 }}>
        <Muted>Destination</Muted>
        <View style={styles.wrap}>
          {DESTINATIONS[stationId].map((d) => (
            <Chip key={d} label={d} active={destination === d} onPress={() => setDestination(d)} />
          ))}
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Muted>Team names (at least 2)</Muted>
        <TextInput value={team} onChangeText={setTeam} placeholder="e.g. Asha, Ravi" placeholderTextColor={colors.muted} style={styles.input} />
      </View>
      <View style={{ gap: 6 }}>
        <Muted>Back within</Muted>
        <View style={styles.wrap}>
          {HOURS.map((h) => (
            <Chip key={h} label={`${h} h`} active={hours === h} onPress={() => setHours(h)} />
          ))}
        </View>
      </View>
      <Button
        label="Check out"
        disabled={team.split(",").filter((n) => n.trim()).length < 2}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          start(stationId, destination, team.trim(), hours);
        }}
      />
      <Muted>Radio the station every 60 minutes. Buddy rule: never go out alone.</Muted>
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, minHeight: 44, fontSize: 15, color: colors.text, backgroundColor: colors.card },
});
