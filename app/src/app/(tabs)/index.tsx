import { useState } from "react";
import { Platform, View } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Screen } from "@/components/chrome";
import { SiteMap } from "@/components/graphics";
import { BuildingReadings, HealthHeader, StatGrid } from "@/components/home-panels";
import { AlertRow } from "@/components/alert-row";
import { Big, Button, Card, CardTitle, Chip, Empty, Loading, Muted } from "@/components/ui";
import { Twin3D } from "@/components/twin-3d";
import { useSync } from "@/context/sync";
import { API_BASE } from "@/lib/supabase";
import { useStation } from "@/context/station";
import { useFuelRunway } from "@/hooks/useDerived";
import { useAlerts } from "@/hooks/useRecords";
import { useStationSnapshot } from "@/hooks/useStationSnapshot";
import { space } from "@/lib/theme";
import { nextResupplyDate } from "@shared/predictions";
import { useColors } from "@/context/theme";

const DAY = 86_400_000;

export default function HomeScreen() {
  const colors = useColors();
  const { stationId } = useStation();
  const { snapshot, refresh } = useStationSnapshot(stationId);
  const runway = useFuelRunway(snapshot);
  const alerts = useAlerts(stationId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { online } = useSync();
  const [view, setView] = useState<"3d" | "map">("3d");
  const [failed3d, setFailed3d] = useState(false);
  // The 3D model is streamed from the website, so it needs a connection; the 2D map always works.
  const can3d = Platform.OS !== "web" && online && Boolean(API_BASE) && !failed3d;
  const show3d = view === "3d" && can3d;

  const onRefresh = async () => {
    setRefreshing(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refresh(), alerts.reload()]);
    setRefreshing(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (!snapshot) {
    return (
      <Screen>
        <Loading label="Reading station sensors…" />
      </Screen>
    );
  }

  const selected = snapshot.buildings.find((b) => b.id === selectedId) ?? null;
  const resupply = nextResupplyDate(snapshot.timestamp);
  const days = Math.ceil((resupply.getTime() - snapshot.timestamp) / DAY);
  const live = snapshot.alerts;
  const latest = [...live, ...alerts.items].slice(0, 3);

  return (
    <Screen onRefresh={() => void onRefresh()} refreshing={refreshing}>
      <Card>
        <HealthHeader snapshot={snapshot} />
        <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.sm }}>
          <Chip label="3D model" active={show3d} onPress={() => (can3d ? setView("3d") : setFailed3d(false))} />
          <Chip label="Map" active={!show3d} onPress={() => setView("map")} />
        </View>
        {show3d ? (
          <Twin3D stationId={stationId} onSelect={setSelectedId} onFail={() => setFailed3d(true)} />
        ) : (
          <SiteMap buildings={snapshot.buildings} selectedId={selectedId} onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))} />
        )}
        {selected ? (
          <BuildingReadings building={selected} snapshot={snapshot} />
        ) : (
          <Muted style={{ marginTop: space.sm }}>
            {show3d ? "Drag to rotate, pinch to zoom, tap a building for its readings." : view === "3d" && !online ? "Offline: showing the map. The 3D model returns when you reconnect." : "Tap a building for its readings."}
          </Muted>
        )}
      </Card>

      <StatGrid snapshot={snapshot} runway={runway} />

      <Card style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexShrink: 1 }}>
          <Muted>Next resupply (ISEA ship)</Muted>
          <Muted>{resupply.toISOString().slice(0, 10)}</Muted>
        </View>
        <Big style={{ color: colors.primary }}>{days} days</Big>
      </Card>

      <Card>
        <CardTitle right={<Button label="All alerts" variant="outline" onPress={() => router.push("/alerts")} style={{ minHeight: 32, paddingHorizontal: space.md }} />}>
          Latest alerts
        </CardTitle>
        {alerts.loading && latest.length === 0 ? (
          <Loading label="Loading alerts…" />
        ) : latest.length === 0 ? (
          <Empty title="No alerts" body={alerts.error ?? "Everything is running normally."} />
        ) : (
          <View style={{ gap: space.sm }}>
            {latest.map((a) => (
              <AlertRow key={a.id} alert={a} live={live.includes(a)} />
            ))}
          </View>
        )}
      </Card>
    </Screen>
  );
}
