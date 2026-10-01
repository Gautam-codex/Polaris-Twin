import { StyleSheet, Switch, View } from "react-native";
import { Screen } from "@/components/chrome";
import { Body, Button, Card, CardTitle, Muted } from "@/components/ui";
import { useSession } from "@/context/session";
import { useStation } from "@/context/station";
import { useSync } from "@/context/sync";
import { describe } from "@/lib/offline-queue";
import { supabase } from "@/lib/supabase";
import { colors, space } from "@/lib/theme";

export default function MoreScreen() {
  const { session } = useSession();
  const { station } = useStation();
  const { online, queue, simulateOffline, setSimulateOffline, lastSyncAt } = useSync();

  return (
    <Screen>
      <Card style={{ gap: space.sm }}>
        <CardTitle>Sync</CardTitle>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Body>Simulate offline</Body>
            <Muted>Hold all changes as if the satellite link were down.</Muted>
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

      <Card style={{ gap: space.sm }}>
        <CardTitle>Station</CardTitle>
        <Body style={{ fontWeight: "600" }}>{station.name}</Body>
        <Muted>{station.region}</Muted>
        <Muted>
          {Math.abs(station.lat).toFixed(2)}° S, {station.lon.toFixed(2)}° E · established {station.established}
        </Muted>
      </Card>

      <Card style={{ gap: space.sm }}>
        <CardTitle>Account</CardTitle>
        <Muted>Signed in as {session?.user.email ?? "unknown"}</Muted>
        <Button label="Sign out" variant="outline" onPress={() => void supabase.auth.signOut()} />
      </Card>

      <Muted style={{ textAlign: "center" }}>Polaris Twin · prototype with a simulated sensor feed. Not an official NCPOR system.</Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  queueItem: { flexDirection: "row", gap: space.sm, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
});
