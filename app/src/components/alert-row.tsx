import { View } from "react-native";
import { Body, Muted, Tag } from "@/components/ui";
import { severityColor, space } from "@/lib/theme";
import type { Alert } from "@shared/types";
import { useColors, themedStyles } from "@/context/theme";

export function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/** One alert with a severity stripe. Only the NCPOR control room (website) acknowledges alerts; the app shows the status. */
export function AlertRow({ alert, live }: { alert: Alert; live?: boolean }) {
  const colors = useColors();
  const styles = useStyles();
  const color = severityColor[alert.severity];
  return (
    <View style={[styles.row, { borderLeftColor: color, opacity: alert.acknowledged ? 0.6 : 1 }]}>
      <View style={styles.top}>
        <Tag label={alert.severity.toUpperCase()} color={color} />
        <Muted style={{ fontSize: 12 }}>{live ? "live sensor · now" : timeAgo(alert.createdAt)}</Muted>
      </View>
      <Body style={{ fontWeight: "600", marginTop: 6 }}>{alert.title}</Body>
      <Muted style={{ marginTop: 2 }}>{alert.message}</Muted>
      {!live && (
        <Muted style={{ marginTop: space.sm, fontSize: 12, color: alert.acknowledged ? colors.success : colors.muted }}>
          {alert.acknowledged ? "✓ Acknowledged by the NCPOR control room" : "Waiting for the control room"}
        </Muted>
      )}
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  row: { borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderRadius: 8, padding: space.md, backgroundColor: colors.card },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
}));
