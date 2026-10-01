import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { Big, Body, Button, Card, CardTitle, Loading, Muted } from "@/components/ui";
import { useStation } from "@/context/station";
import { useSync } from "@/context/sync";
import { getTeamMood } from "@/lib/data";
import { colors, radius, space } from "@/lib/theme";

const KEY = "polaris-twin:last-checkin";
const FACES = ["😞", "🙁", "😐", "🙂", "😄"];
const FACE_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function Scale({ value, onChange, labels }: { value: number; onChange: (v: number) => void; labels: string[] }) {
  return (
    <View style={styles.scale}>
      {labels.map((label, i) => {
        const v = i + 1;
        const active = value === v;
        return (
          <Pressable
            key={label}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(v);
            }}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={styles.optionText}>{label.length <= 2 ? label : String(v)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Anonymous daily check-in: mood, energy and sleep. Only team averages are ever shown. */
export default function CheckinScreen() {
  const { stationId, station } = useStation();
  const { submit, online } = useSync();
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [sleep, setSleep] = useState(7);
  const [doneToday, setDoneToday] = useState<boolean | null>(null);
  const [team, setTeam] = useState<{ mood: number | null; responses: number } | null>(null);

  const loadTeam = useCallback(() => {
    getTeamMood(stationId, 7)
      .then(setTeam)
      .catch(() => setTeam({ mood: null, responses: 0 }));
  }, [stationId]);

  useEffect(() => {
    void AsyncStorage.getItem(KEY)
      .then((last) => {
        const done = last === today();
        setDoneToday(done);
        if (done) loadTeam();
      })
      .catch(() => setDoneToday(false));
  }, [loadTeam]);

  const send = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await submit({ kind: "createCheckin", checkin: { stationId, mood, energy, sleepHours: sleep } });
    await AsyncStorage.setItem(KEY, today()).catch(() => undefined);
    setDoneToday(true);
    loadTeam();
  };

  if (doneToday === null) return <Loading label="Loading…" />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {doneToday ? (
        <>
          <Card style={{ gap: space.sm }}>
            <Body style={{ fontWeight: "600" }}>Thanks, you have checked in today.</Body>
            <Muted>{online ? "Your answers were sent without your name." : "Saved on this phone; it will send when the link is back."}</Muted>
          </Card>
          <Card>
            <CardTitle>Team mood · last 7 days</CardTitle>
            {team === null ? (
              <Loading label="Loading team average…" />
            ) : team.mood === null ? (
              <Muted>Not enough check-ins yet to show an average ({team.responses} of 3 needed).</Muted>
            ) : (
              <>
                <Big>
                  {FACES[Math.min(4, Math.max(0, Math.round(team.mood) - 1))]} {team.mood.toFixed(1)} / 5
                </Big>
                <Muted>{station.name} · {team.responses} check-ins</Muted>
              </>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card style={{ gap: space.md }}>
            <CardTitle>How are you today?</CardTitle>
            <View>
              <Muted>Mood{mood ? ` · ${FACE_LABELS[mood - 1]}` : ""}</Muted>
              <Scale value={mood} onChange={setMood} labels={FACES} />
            </View>
            <View>
              <Muted>Energy (1 = exhausted, 5 = full of energy)</Muted>
              <Scale value={energy} onChange={setEnergy} labels={["1", "2", "3", "4", "5"]} />
            </View>
            <View>
              <Muted>Sleep last night: {sleep.toFixed(1)} h</Muted>
              <Slider
                minimumValue={0}
                maximumValue={12}
                step={0.5}
                value={sleep}
                onValueChange={setSleep}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                accessibilityLabel="Hours of sleep"
              />
            </View>
            <Button label="Submit check-in" disabled={!mood || !energy} onPress={() => void send()} />
          </Card>
          <Muted style={{ textAlign: "center" }}>Anonymous. Only team averages are shown. One check-in per day on this phone.</Muted>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  scale: { flexDirection: "row", gap: space.sm, marginTop: 6 },
  option: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.accent },
  optionText: { fontSize: 22, color: colors.text },
});
