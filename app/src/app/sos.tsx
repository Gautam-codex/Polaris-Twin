import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Body, Button, Card, CardTitle, Muted } from "@/components/ui";
import { useT } from "@/context/language";
import { useStation } from "@/context/station";
import { useSync } from "@/context/sync";
import { radius, space, tint } from "@/lib/theme";
import { PLAYBOOKS, type EmergencyKind } from "@shared/playbooks";
import type { AlertSystem } from "@shared/types";
import { useColors, themedStyles } from "@/context/theme";

interface Choice {
  key: string;
  label: string;
  playbook: EmergencyKind;
  system: AlertSystem;
  icon: keyof typeof Ionicons.glyphMap;
}

const CHOICES: Choice[] = [
  { key: "fire", label: "Fire", playbook: "fire", system: "power", icon: "flame-outline" },
  { key: "medical", label: "Medical evacuation", playbook: "medevac", system: "comms", icon: "medkit-outline" },
  { key: "power", label: "Power failure", playbook: "power", system: "power", icon: "flash-off-outline" },
  { key: "missing", label: "Person missing", playbook: "blizzard", system: "weather", icon: "person-outline" },
];

/** Choose the emergency, send a critical alert and incident (queued when offline), then follow the checklist. */
export default function SosScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { station, stationId } = useStation();
  const { submit, online } = useSync();
  const t = useT();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);

  const send = async () => {
    if (!choice) return;
    const at = Date.now();
    const time = new Date(at).toISOString().slice(11, 16);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setSentAt(at);
    await submit({
      kind: "createAlert",
      alert: {
        stationId,
        system: choice.system,
        severity: "critical",
        title: `SOS: ${choice.label}`,
        message: `SOS raised from the crew app at ${station.name} at ${time} UTC. Follow ${PLAYBOOKS[choice.playbook].sop}.`,
      },
    });
    await submit({
      kind: "createIncident",
      incident: {
        stationId,
        title: `SOS: ${choice.label} at ${station.name}`,
        description: `Raised from the crew app at ${time} UTC.`,
        severity: "high",
        reportedBy: "Crew (mobile SOS)",
      },
    });
  };

  if (sentAt && choice) {
    const playbook = PLAYBOOKS[choice.playbook];
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card style={{ borderColor: colors.danger, backgroundColor: tint(colors.danger, 0.06) }}>
          <Body style={{ fontWeight: "700", color: colors.danger }}>SOS: {t(choice.label)} · {station.name}</Body>
          <Muted style={{ marginTop: 4 }}>
            {online
              ? `Alert and incident sent at ${new Date(sentAt).toISOString().slice(11, 16)} UTC. NCPOR Goa can see it.`
              : "Offline: saved on this phone and retrying every 10 s until the link is back."}
          </Muted>
        </Card>
        <Card>
          <CardTitle right={<Muted>{done.length}/{playbook.steps.length}</Muted>}>Checklist</CardTitle>
          <Muted style={{ marginBottom: space.sm }}>{playbook.sop}</Muted>
          {playbook.steps.map((step, i) => {
            const checked = done.includes(i);
            return (
              <Pressable
                key={step}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setDone((d) => (checked ? d.filter((x) => x !== i) : [...d, i]));
                }}
                style={styles.step}
              >
                <Ionicons name={checked ? "checkbox" : "square-outline"} size={22} color={checked ? colors.danger : colors.muted} />
                <Text style={[styles.stepText, checked && { color: colors.muted, textDecorationLine: "line-through" }]}>
                  {i + 1}. {step}
                </Text>
              </Pressable>
            );
          })}
        </Card>
        <Button label="Close" variant="outline" onPress={() => router.back()} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <CardTitle>Choose the emergency</CardTitle>
      {CHOICES.map((c) => {
        const active = choice?.key === c.key;
        return (
          <Pressable
            key={c.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => {
              void Haptics.selectionAsync();
              setChoice(c);
            }}
            style={[styles.choice, active && { borderColor: colors.danger, backgroundColor: tint(colors.danger, 0.06) }]}
          >
            <Ionicons name={c.icon} size={26} color={active ? colors.danger : colors.text} />
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: "600" }}>{t(c.label)}</Body>
              <Muted numberOfLines={2}>{PLAYBOOKS[c.playbook].summary}</Muted>
            </View>
          </Pressable>
        );
      })}
      <Button label="Send SOS" variant="danger" disabled={!choice} onPress={() => void send()} style={{ marginTop: space.sm }} />
      <Muted style={{ textAlign: "center" }}>Sends a critical alert and an incident to the station and NCPOR Goa.</Muted>
    </ScrollView>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  choice: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.card },
  step: { flexDirection: "row", gap: space.sm, paddingVertical: space.sm, alignItems: "flex-start" },
  stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
}));
