import { StyleSheet } from "react-native";
import type { AlertSeverity, Health } from "@shared/types";

/** Polaris Twin palettes (see CLAUDE.md). Status colours are mid-tones that read on both. */
export const lightColors = {
  brand: "#C6E1FF",
  background: "#F5F8FC",
  card: "#FFFFFF",
  border: "#DBE4EE",
  text: "#0F1F33",
  muted: "#5A6B80",
  primary: "#1D4F86",
  primaryText: "#FFFFFF",
  secondary: "#5B9BDC",
  accent: "#E7F1FD",
  success: "#1C7C4A",
  warning: "#A15C07",
  danger: "#B42318",
  bannerWarn: "#FDF1EF",
  mapGrid: "#E3EEFA",
};

export type Palette = typeof lightColors;

export const darkColors: Palette = {
  brand: "#C6E1FF",
  background: "#0D1624",
  card: "#142033",
  border: "#24344D",
  text: "#E3EBF5",
  muted: "#95A7BC",
  primary: "#8BBCF0",
  primaryText: "#0D1624",
  secondary: "#4F8FD1",
  accent: "#1B2B43",
  success: "#4CC38A",
  warning: "#E3A64A",
  danger: "#F07163",
  bannerWarn: "#2A1C22",
  mapGrid: "#22324A",
};

export const healthColor: Record<Health, string> = { ok: "#2E9E62", warning: "#C98515", critical: "#D2392B" };
export const roofColor: Record<Health, string> = { ok: "#8CCBA6", warning: "#E3A64A", critical: "#C8372D" };
export const healthLabel: Record<Health, string> = { ok: "OK", warning: "Warning", critical: "Critical" };
export const severityColor: Record<AlertSeverity, string> = { info: "#4F8FD1", warning: "#C98515", critical: "#D2392B" };

/** Light tinted background for a status colour. */
export function tint(hex: string, alpha = 0.1): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 4, md: 8, lg: 12 } as const;

/** Cache of StyleSheets per palette, used by `themedStyles`. */
export function createStyleCache<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette) => T) {
  const cache = new Map<Palette, T>();
  return (colors: Palette): T => {
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(factory(colors));
      cache.set(colors, styles);
    }
    return styles;
  };
}
