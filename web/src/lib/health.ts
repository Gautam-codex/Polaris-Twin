import type { AlertSeverity, Health } from "@/shared/types";

export const HEALTH_LABEL: Record<Health, string> = { ok: "OK", warning: "Warning", critical: "Critical" };

/** Pill styles (border, background, text) per health level. */
export const HEALTH_STYLE: Record<Health, string> = {
  ok: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
};

/** Raw colours for charts and the 3D scene. */
export const HEALTH_HEX: Record<Health, string> = { ok: "#22C55E", warning: "#F59E0B", critical: "#EF4444" };

export const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  info: "border-primary/30 bg-primary/10 text-primary",
  warning: HEALTH_STYLE.warning,
  critical: HEALTH_STYLE.critical,
};

export const CHART = {
  primary: "#38BDF8",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  grid: "rgba(148,163,184,0.12)",
  axis: "#94A3B8",
};
