import type { ReactNode } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Text } from "@/components/text";
import { useStation } from "@/context/station";
import { useSync } from "@/context/sync";
import { radius, space } from "@/lib/theme";
import { STATION_IDS, STATIONS } from "@shared/stations";
import { useColors, themedStyles } from "@/context/theme";

/** Slim status line: "Online · synced" or "Offline · N changes queued". */
export function SyncBanner() {
  const colors = useColors();
  const styles = useStyles();
  const { online, queue } = useSync();
  const queued = queue.length;
  const color = online ? (queued ? colors.warning : colors.success) : colors.danger;
  const text = online
    ? queued
      ? `Online · syncing ${queued} change${queued === 1 ? "" : "s"}`
      : "Online · synced"
    : `Offline · ${queued} change${queued === 1 ? "" : "s"} queued`;
  return (
    <View style={[styles.banner, { backgroundColor: online && !queued ? colors.accent : colors.bannerWarn }]} accessibilityRole="text">
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.bannerText, { color }]}>{text}</Text>
      <Text style={styles.sim}>Simulated sensor feed</Text>
    </View>
  );
}

/** Maitri / Bharati switcher for the header. */
export function StationSwitcher() {
  const styles = useStyles();
  const { stationId, setStation } = useStation();
  return (
    <View style={styles.switcher}>
      {STATION_IDS.map((id) => (
        <Pressable
          key={id}
          onPress={() => setStation(id)}
          accessibilityRole="button"
          accessibilityState={{ selected: stationId === id }}
          style={[styles.switchItem, stationId === id && styles.switchActive]}
        >
          <Text style={[styles.switchText, stationId === id && styles.switchTextActive]}>{STATIONS[id].name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Scrollable screen body with the sync banner on top and optional pull to refresh. */
export function Screen({ children, onRefresh, refreshing = false }: { children: ReactNode; onRefresh?: () => void; refreshing?: boolean }) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.screen}>
      <SyncBanner />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} /> : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md, paddingBottom: 96 },
  banner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: space.lg, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 7, height: 7, borderRadius: 4 },
  bannerText: { fontSize: 12, fontWeight: "600" },
  sim: { marginLeft: "auto", fontSize: 11, color: colors.muted },
  switcher: { flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 2, marginRight: space.md, backgroundColor: colors.card },
  switchItem: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  switchActive: { backgroundColor: colors.accent },
  switchText: { fontSize: 13, color: colors.muted },
  switchTextActive: { color: colors.primary, fontWeight: "600" },
}));
