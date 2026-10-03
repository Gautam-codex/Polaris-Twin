import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/text";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useT } from "@/context/language";
import { themedStyles } from "@/context/theme";


const HOLD_MS = 2000;
const SIZE = 64;
const STROKE = 4;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

/** Floating SOS button: hold for 2 s (ring fills, haptics build up) to open the SOS screen. */
export function SosButton() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const t = useT();
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const started = useRef(0);
  const pulses = useRef(0);

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setProgress(0);
  };

  useEffect(() => stop, []);

  // Uses the animation-frame timestamp, so timing follows the display refresh.
  const step = (ts: number) => {
    if (started.current < 0) started.current = ts;
    const p = Math.min(1, (ts - started.current) / HOLD_MS);
    setProgress(p);
    // A firmer tap every half second while holding.
    const pulse = Math.floor(p * 4);
    if (pulse > pulses.current && p < 1) {
      pulses.current = pulse;
      void Haptics.impactAsync(pulse >= 3 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    }
    if (p >= 1) {
      frame.current = null;
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setProgress(0);
      router.push("/sos");
      return;
    }
    frame.current = requestAnimationFrame(step);
  };

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + 64 }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Hold for SOS")}
        accessibilityHint="Press and hold for two seconds to raise an emergency"
        onPressIn={() => {
          started.current = -1;
          pulses.current = 0;
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          frame.current = requestAnimationFrame(step);
        }}
        onPressOut={stop}
        style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.96 }] }]}
      >
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(255,255,255,0.35)" strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="#FFFFFF"
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={CIRC * (1 - progress)}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <Text style={styles.label}>SOS</Text>
      </Pressable>
      {progress > 0 && <Text style={styles.hint}>{t("Hold for SOS")}</Text>}
    </View>
  );
}

const useStyles = themedStyles((colors) => ({
  wrap: { position: "absolute", right: 16, alignItems: "center" },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#C62D21",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  label: { color: "#FFFFFF", fontWeight: "700", fontSize: 16, letterSpacing: 1 },
  hint: { marginTop: 6, fontSize: 11, color: "#D2392B", fontWeight: "600" },
}));
