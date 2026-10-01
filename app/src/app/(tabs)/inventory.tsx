import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/chrome";
import { Body, Button, Card, Empty, ErrorText, Loading, Muted, Tag } from "@/components/ui";
import { useStation } from "@/context/station";
import { useInventory } from "@/hooks/useRecords";
import { healthColor, radius, space, tint } from "@/lib/theme";
import { formatNumber } from "@shared/alerts";
import { inventoryDaysLeft, itemsAtRisk, nextResupplyDate } from "@shared/predictions";
import type { InventoryCategory, InventoryItem } from "@shared/types";
import { useColors, themedStyles } from "@/context/theme";

const ORDER: InventoryCategory[] = ["fuel", "food", "medical", "spares", "science"];
const LABEL: Record<InventoryCategory, string> = { fuel: "Fuel", food: "Food", medical: "Medical", spares: "Spares", science: "Science" };

function Stepper({ item, onChange }: { item: InventoryItem; onChange: (q: number) => void }) {
  const colors = useColors();
  const styles = useStyles();
  const step = Math.max(1, Math.round(item.dailyUse));
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityLabel={`Use ${step} ${item.unit} of ${item.name}`} onPress={() => onChange(item.quantity - step)} style={styles.stepBtn} hitSlop={6}>
        <Ionicons name="remove" size={18} color={colors.primary} />
      </Pressable>
      <Text style={styles.qty}>
        {formatNumber(item.quantity)} {item.unit}
      </Text>
      <Pressable accessibilityLabel={`Add ${step} ${item.unit} of ${item.name}`} onPress={() => onChange(item.quantity + step)} style={styles.stepBtn} hitSlop={6}>
        <Ionicons name="add" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export default function InventoryScreen() {
  const colors = useColors();
  const styles = useStyles();
  const { stationId } = useStation();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { items, loading, error, reload, setQuantity } = useInventory(stationId);
  const [query, setQuery] = useState(focus ?? "");
  const [appliedFocus, setAppliedFocus] = useState(focus);
  const [refreshing, setRefreshing] = useState(false);
  const [now] = useState(() => Date.now());

  // A scan opens this tab with ?focus=<item>; show that item.
  if (focus !== appliedFocus) {
    setAppliedFocus(focus);
    if (focus) setQuery(focus);
  }

  const atRisk = useMemo(() => new Set(itemsAtRisk(items, nextResupplyDate(now), now).map((i) => i.id)), [items, now]);
  const shown = items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void reload().then(() => setRefreshing(false));
      }}
    >
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search stores" placeholderTextColor={colors.muted} style={styles.searchInput} />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} accessibilityLabel="Clear search" hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <Button label="Scan" icon={<Ionicons name="barcode-outline" size={18} color={colors.primaryText} />} onPress={() => router.push("/scan")} />
      </View>
      <Muted>{atRisk.size} item{atRisk.size === 1 ? "" : "s"} at risk before the next resupply.</Muted>
      {error && <ErrorText message={error} />}

      {loading && items.length === 0 ? (
        <Loading label="Loading stores…" />
      ) : shown.length === 0 ? (
        <Empty title="No items found" body={query ? `Nothing matches “${query}”.` : "The store list is empty."} />
      ) : (
        ORDER.filter((c) => shown.some((i) => i.category === c)).map((category) => (
          <Card key={category} style={{ paddingVertical: space.sm }}>
            <Text style={styles.group}>{LABEL[category]}</Text>
            {shown
              .filter((i) => i.category === category)
              .map((item) => {
                const risk = atRisk.has(item.id);
                const days = inventoryDaysLeft(item);
                return (
                  <View key={item.id} style={[styles.item, risk && { backgroundColor: tint(healthColor.warning, 0.1) }]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Body style={{ fontWeight: "600" }}>{item.name}</Body>
                      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center", flexWrap: "wrap" }}>
                        <Muted>{Number.isFinite(days) ? `${Math.floor(days)} days left` : "Not used daily"}</Muted>
                        {risk && <Tag label="AT RISK" color={healthColor.warning} />}
                      </View>
                    </View>
                    <Stepper
                      item={item}
                      onChange={(q) => {
                        void Haptics.selectionAsync();
                        void setQuantity(item, q);
                      }}
                    />
                  </View>
                );
              })}
          </Card>
        ))
      )}
    </Screen>
  );
}

const useStyles = themedStyles((colors) => ({
  searchRow: { flexDirection: "row", gap: space.sm, alignItems: "center" },
  search: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, minHeight: 44, backgroundColor: colors.card },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 8 },
  group: { fontSize: 12, fontWeight: "600", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6, marginVertical: space.sm },
  item: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.sm, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: colors.border, borderRadius: 6 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  qty: { minWidth: 72, textAlign: "center", fontSize: 13, color: colors.text, fontVariant: ["tabular-nums"] },
}));
