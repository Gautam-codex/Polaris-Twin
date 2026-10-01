import { useState } from "react";
import { ScrollView, View } from "react-native";
import * as Haptics from "expo-haptics";
import { AlertRow } from "@/components/alert-row";
import { Screen } from "@/components/chrome";
import { Chip, Empty, ErrorText, Loading } from "@/components/ui";
import { useStation } from "@/context/station";
import { useAlerts } from "@/hooks/useRecords";
import { useStationSnapshot } from "@/hooks/useStationSnapshot";
import { space } from "@/lib/theme";
import type { Alert } from "@shared/types";

type Filter = "open" | "all" | "critical" | "warning";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
];

function matches(alert: Alert, filter: Filter): boolean {
  if (filter === "open") return !alert.acknowledged;
  if (filter === "all") return true;
  return alert.severity === filter;
}

export default function AlertsScreen() {
  const { stationId } = useStation();
  const { items, loading, error, reload, acknowledge } = useAlerts(stationId);
  const { snapshot } = useStationSnapshot(stationId);
  const [filter, setFilter] = useState<Filter>("open");
  const [refreshing, setRefreshing] = useState(false);

  const live = (snapshot?.alerts ?? []).filter((a) => matches(a, filter));
  const stored = items.filter((a) => matches(a, filter));

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void reload().then(() => setRefreshing(false));
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>
      {error && <ErrorText message={error} />}
      {loading && items.length === 0 ? (
        <Loading label="Loading alerts…" />
      ) : live.length + stored.length === 0 ? (
        <Empty title="No alerts here" body={filter === "open" ? "Everything has been acknowledged." : "Nothing matches this filter."} />
      ) : (
        <View style={{ gap: space.sm }}>
          {live.map((a) => (
            <AlertRow key={a.id} alert={a} live />
          ))}
          {stored.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              onAcknowledge={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void acknowledge(a.id);
              }}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
