import type { AlertSeverity, Health } from "@shared/types";

/** Polaris Twin palette (see CLAUDE.md). */
export const colors = {
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
} as const;

export const healthColor: Record<Health, string> = { ok: colors.success, warning: "#C27A12", critical: colors.danger };
export const roofColor: Record<Health, string> = { ok: "#8CCBA6", warning: "#E3A64A", critical: "#C8372D" };
export const healthLabel: Record<Health, string> = { ok: "OK", warning: "Warning", critical: "Critical" };

export const severityColor: Record<AlertSeverity, string> = {
  info: colors.primary,
  warning: "#C27A12",
  critical: colors.danger,
};

/** Light tinted background for a status colour. */
export function tint(hex: string, alpha = 0.1): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 4, md: 8, lg: 12 } as const;
