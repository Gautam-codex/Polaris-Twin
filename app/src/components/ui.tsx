import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useT } from "@/context/language";
import { colors, radius, space, tint } from "@/lib/theme";

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const t = useT();
  return (
    <View style={styles.cardTitleRow}>
      <Text style={styles.cardTitle}>{typeof children === "string" ? t(children) : children}</Text>
      {right}
    </View>
  );
}

export function Big({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.big, style]}>{children}</Text>;
}

export function Muted({ children, style, numberOfLines }: { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

/** Small status tag in a status colour. */
export function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { borderColor: tint(color, 0.35), backgroundColor: tint(color, 0.08) }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const bg = variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : colors.card;
  const fg = variant === "outline" ? colors.text : colors.primaryText;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === "outline" ? colors.border : bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, { color: fg }]}>{t(label)}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, active && { color: colors.primary, fontWeight: "600" }]}>{t(label)}</Text>
    </Pressable>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Muted style={{ marginTop: space.sm }}>{label}</Muted>
    </View>
  );
}

export function Empty({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.center}>
      <Body style={{ fontWeight: "600" }}>{title}</Body>
      {body && <Muted style={{ marginTop: space.xs, textAlign: "center" }}>{body}</Muted>}
    </View>
  );
}

export function ErrorText({ message }: { message: string }) {
  return <Text style={styles.error}>{message}</Text>;
}

export const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg },
  cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md, gap: space.sm },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.text, flexShrink: 1 },
  big: { fontSize: 26, fontWeight: "600", color: colors.text, fontVariant: ["tabular-nums"] },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  tag: { borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
  tagText: { fontSize: 11, fontWeight: "600" },
  button: { flexDirection: "row", gap: space.sm, alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.lg, minHeight: 44 },
  buttonText: { fontSize: 15, fontWeight: "600" },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: 6, backgroundColor: colors.card },
  chipText: { fontSize: 13, color: colors.muted },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: space.xl, paddingHorizontal: space.lg },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
});
