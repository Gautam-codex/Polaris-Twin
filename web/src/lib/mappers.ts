// Convert Supabase snake_case rows into the camelCase shared types.
import type {
  Alert,
  AlertSeverity,
  AlertSystem,
  ComplianceKind,
  ComplianceLog,
  Incident,
  IncidentSeverity,
  IncidentStatus,
  InventoryCategory,
  InventoryItem,
  StationId,
  WellbeingCheckin,
} from "@/shared/types";

export interface InventoryRow {
  id: string;
  station_id: StationId;
  name: string;
  category: InventoryCategory;
  quantity: number | string;
  unit: string;
  daily_use: number | string;
  min_level: number | string;
}

export interface AlertRow {
  id: string;
  station_id: StationId;
  system: AlertSystem;
  severity: AlertSeverity;
  title: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

export interface IncidentRow {
  id: string;
  station_id: StationId;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reported_by: string;
  created_at: string;
}

export interface CheckinRow {
  id: string;
  station_id: StationId;
  mood: number;
  sleep_hours: number | string;
  energy: number;
  created_at: string;
}

export interface ComplianceRow {
  id: string;
  station_id: StationId;
  kind: ComplianceKind;
  amount: number | string;
  unit: string;
  note: string;
  created_at: string;
}

export function toInventory(r: InventoryRow): InventoryItem {
  return {
    id: r.id,
    stationId: r.station_id,
    name: r.name,
    category: r.category,
    quantity: Number(r.quantity),
    unit: r.unit,
    dailyUse: Number(r.daily_use),
    minLevel: Number(r.min_level),
  };
}

export function toAlert(r: AlertRow): Alert {
  return {
    id: r.id,
    stationId: r.station_id,
    system: r.system,
    severity: r.severity,
    title: r.title,
    message: r.message,
    createdAt: r.created_at,
    acknowledged: r.acknowledged,
  };
}

export function toIncident(r: IncidentRow): Incident {
  return {
    id: r.id,
    stationId: r.station_id,
    title: r.title,
    description: r.description,
    severity: r.severity,
    status: r.status,
    reportedBy: r.reported_by,
    createdAt: r.created_at,
  };
}

export function toCheckin(r: CheckinRow): WellbeingCheckin {
  return {
    id: r.id,
    stationId: r.station_id,
    mood: r.mood,
    sleepHours: Number(r.sleep_hours),
    energy: r.energy,
    createdAt: r.created_at,
  };
}

export function toComplianceLog(r: ComplianceRow): ComplianceLog {
  return {
    id: r.id,
    stationId: r.station_id,
    kind: r.kind,
    amount: Number(r.amount),
    unit: r.unit,
    note: r.note,
    createdAt: r.created_at,
  };
}
