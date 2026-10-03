import { ScrollView, Switch, View } from "react-native";
import { Body, Card, CardTitle, Chip, Muted } from "@/components/ui";
import { useLanguage } from "@/context/language";
import { useSync } from "@/context/sync";
import { describe } from "@/lib/offline-queue";
import { space } from "@/lib/theme";
import { useColors, useTheme, themedStyles } from "@/context/theme";

export default function SettingsScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { language, setLanguage } = useLanguage();
  const { mode, setMode } = useTheme();
  const { online, queue, simulateOffline, setSimulateOffline, lastSyncAt } = useSync();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card style={{ gap: space.sm }}>
        <CardTitle>Language</CardTitle>
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Chip label="English" active={language === "en"} onPress={() => setLanguage("en")} />
          <Chip label="हिंदी" active={language === "hi"} onPress={() => setLanguage("hi")} />
        </View>
        <Muted>The whole app switches language. Units such as kW, L and km/h stay the same.</Muted>
      </Card>

      <Card style={{ gap: space.sm }}>
        <CardTitle>Appearance</CardTitle>
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
          <Chip label="System" active={mode === "system"} onPress={() => setMode("system")} />
          <Chip label="Light" active={mode === "light"} onPress={() => setMode("light")} />
          <Chip label="Dark" active={mode === "dark"} onPress={() => setMode("dark")} />
        </View>
        <Muted>System follows your phone&apos;s light or dark setting.</Muted>
      </Card>

      <Card style={{ gap: space.sm }}>
        <CardTitle>Sync</CardTitle>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Body>Simulate offline</Body>
            <Muted>Hold all changes as if the satellite link were down. Turn off to send them.</Muted>
          </View>
          <Switch
            value={simulateOffline}
            onValueChange={setSimulateOffline}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel="Simulate offline"
          />
        </View>
        <Muted>
          {online ? "Online" : "Offline"} · {queue.length} queued
          {lastSyncAt ? ` · last sync ${new Date(lastSyncAt).toISOString().slice(11, 19)} UTC` : ""}
        </Muted>
        {queue.map((q) => (
          <View key={q.id} style={styles.queueItem}>
            <Body style={{ flex: 1 }}>{describe(q.action)}</Body>
            <Muted>{new Date(q.queuedAt).toISOString().slice(11, 16)}</Muted>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  queueItem: { flexDirection: "row", gap: space.sm, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
}));
