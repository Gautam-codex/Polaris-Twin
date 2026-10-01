import type { AlertSeverity, Health } from "@/shared/types";

export const HEALTH_LABEL: Record<Health, string> = { ok: "OK", warning: "Warning", critical: "Critical" };

/** Status tag styles (border, background, text) per health level. */
export const HEALTH_STYLE: Record<Health, string> = {
  ok: "border-success/25 bg-success/8 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  critical: "border-destructive/30 bg-destructive/8 text-destructive",
};

/** Raw colours for charts and the 3D scene. */
export const HEALTH_HEX: Record<Health, string> = { ok: "#1C7C4A", warning: "#C27A12", critical: "#B42318" };

/** Softer roof colours for the 3D twin, so a healthy station reads calm. */
export const ROOF_HEX: Record<Health, string> = { ok: "#8CCBA6", warning: "#E3A64A", critical: "#C8372D" };

export const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  info: "border-primary/25 bg-secondary text-primary",
  warning: HEALTH_STYLE.warning,
  critical: HEALTH_STYLE.critical,
};

export const CHART = {
  primary: "#1D4F86",
  secondary: "#5B9BDC",
  brand: "#C6E1FF",
  success: "#1C7C4A",
  warning: "#C27A12",
  danger: "#B42318",
  grid: "#E6EDF5",
  axis: "#6B7C90",
};

export const TOOLTIP_STYLE = {
  background: "#FFFFFF",
  border: "1px solid #DBE4EE",
  borderRadius: 6,
  fontSize: 12,
  color: "#0F1F33",
  boxShadow: "0 2px 8px rgba(15,31,51,0.08)",
};
