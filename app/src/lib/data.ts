// Typed Supabase access for the crew app (mirrors web/src/lib/data.ts).
import type {
  Alert,
  AlertSeverity,
  AlertSystem,
  Incident,
  IncidentSeverity,
  InventoryCategory,
  InventoryItem,
  StationId,
  WellbeingCheckin,
} from "@shared/types";
import { supabase } from "./supabase";

const OFFLINE = "No connection to the station database. Showing what is on this phone.";

export function friendlyError(message: string): string {
  return /network request failed|failed to fetch|fetch failed/i.test(message) ? OFFLINE : message;
}

function fail(message: string): never {
  throw new Error(friendlyError(message));
}

interface AlertRow {
  id: string;
  station_id: StationId;
  system: AlertSystem;
  severity: AlertSeverity;
  title: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

interface InventoryRow {
  id: string;
  station_id: StationId;
  name: string;
  category: InventoryCategory;
  quantity: number | string;
  unit: string;
  daily_use: number | string;
  min_level: number | string;
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

function toInventory(r: InventoryRow): InventoryItem {
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

export async function getAlerts(stationId: StationId, limit = 50): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("station_id", stationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail(error.message);
  return ((data ?? []) as AlertRow[]).map(toAlert);
}

export async function acknowledgeAlert(id: string): Promise<void> {
  const { error } = await supabase.from("alerts").update({ acknowledged: true }).eq("id", id);
  if (error) fail(error.message);
}

export type NewAlert = Pick<Alert, "stationId" | "system" | "severity" | "title" | "message">;

export async function createAlert(alert: NewAlert): Promise<void> {
  const { error } = await supabase.from("alerts").insert({
    station_id: alert.stationId,
    system: alert.system,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
  });
  if (error) fail(error.message);
}

/** Calls `onInsert` for every new alert at the station. Returns an unsubscribe function. */
export function subscribeToNewAlerts(stationId: StationId, onInsert: (alert: Alert) => void): () => void {
  const channel = supabase
    .channel(`app-alerts-${stationId}-${Date.now()}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts", filter: `station_id=eq.${stationId}` }, (payload) =>
      onInsert(toAlert(payload.new as AlertRow)),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function getInventory(stationId: StationId): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from("inventory").select("*").eq("station_id", stationId).order("category").order("name");
  if (error) fail(error.message);
  return ((data ?? []) as InventoryRow[]).map(toInventory);
}

export async function updateInventoryQuantity(id: string, quantity: number): Promise<void> {
  const { error } = await supabase.from("inventory").update({ quantity }).eq("id", id);
  if (error) fail(error.message);
}

export type NewIncident = Pick<Incident, "stationId" | "title" | "description" | "severity" | "reportedBy"> & { severity: IncidentSeverity };

export async function createIncident(incident: NewIncident): Promise<void> {
  const { error } = await supabase.from("incidents").insert({
    station_id: incident.stationId,
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    reported_by: incident.reportedBy,
  });
  if (error) fail(error.message);
}

export type NewCheckin = Pick<WellbeingCheckin, "stationId" | "mood" | "sleepHours" | "energy">;

export async function createCheckin(checkin: NewCheckin): Promise<void> {
  const { error } = await supabase.from("wellbeing_checkins").insert({
    station_id: checkin.stationId,
    mood: checkin.mood,
    sleep_hours: checkin.sleepHours,
    energy: checkin.energy,
  });
  if (error) fail(error.message);
}
