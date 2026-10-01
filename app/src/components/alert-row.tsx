import { StyleSheet, View } from "react-native";
import { Body, Button, Muted, Tag } from "@/components/ui";
import { colors, severityColor, space } from "@/lib/theme";
import type { Alert } from "@shared/types";

export function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/** One alert with a severity stripe; stored alerts can be acknowledged. */
export function AlertRow({ alert, live, onAcknowledge }: { alert: Alert; live?: boolean; onAcknowledge?: () => void }) {
  const color = severityColor[alert.severity];
  return (
    <View style={[styles.row, { borderLeftColor: color, opacity: alert.acknowledged ? 0.6 : 1 }]}>
      <View style={styles.top}>
        <Tag label={alert.severity.toUpperCase()} color={color} />
        <Muted style={{ fontSize: 12 }}>{live ? "live sensor · now" : timeAgo(alert.createdAt)}</Muted>
      </View>
      <Body style={{ fontWeight: "600", marginTop: 6 }}>{alert.title}</Body>
      <Muted style={{ marginTop: 2 }}>{alert.message}</Muted>
      {onAcknowledge && !alert.acknowledged && (
        <Button label="Acknowledge" variant="outline" onPress={onAcknowledge} style={{ marginTop: space.sm, alignSelf: "flex-start", minHeight: 36 }} />
      )}
      {alert.acknowledged && <Muted style={{ marginTop: 6, color: colors.success }}>Acknowledged</Muted>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderRadius: 8, padding: space.md, backgroundColor: colors.card },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
