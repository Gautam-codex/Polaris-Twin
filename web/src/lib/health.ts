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

/** Chart colours as CSS variables, so they follow the light / dark theme (see globals.css). */
export const CHART = {
  primary: "var(--viz-primary)",
  secondary: "var(--viz-secondary)",
  brand: "var(--viz-brand)",
  success: "var(--viz-success)",
  warning: "var(--viz-warning)",
  danger: "var(--viz-danger)",
  grid: "var(--viz-grid)",
  axis: "var(--viz-axis)",
};

export const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 12,
  color: "var(--popover-foreground)",
  boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
};
