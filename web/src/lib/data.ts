// Typed Supabase data access. Every function throws on a Supabase error.
import { getSupabase } from "./supabase";
import {
  toAlert,
  toCheckin,
  toComplianceLog,
  toIncident,
  toInventory,
  type AlertRow,
  type CheckinRow,
  type ComplianceRow,
  type IncidentRow,
  type InventoryRow,
} from "./mappers";
import type {
  Alert,
  ComplianceLog,
  Incident,
  InventoryItem,
  StationId,
  WellbeingCheckin,
  WellbeingTrendPoint,
} from "@/shared/types";

const OFFLINE_MESSAGE = "Can't reach the station database right now. Live sensor data still works; stored records will load when the connection returns.";

/** Turns low-level network failures into a message a crew member can act on. */
export function friendlyError(message: string): string {
  return /failed to fetch|networkerror|fetch failed|load failed/i.test(message) ? OFFLINE_MESSAGE : message;
}

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(friendlyError(result.error.message));
  if (result.data === null) throw new Error("Supabase returned no data");
  return result.data;
}

// ---- Inventory

export async function getInventory(stationId: StationId): Promise<InventoryItem[]> {
  const rows = check(
    await getSupabase().from("inventory").select("*").eq("station_id", stationId).order("category").order("name"),
  );
  return (rows as InventoryRow[]).map(toInventory);
}

export type InventoryPatch = Partial<Pick<InventoryItem, "quantity" | "dailyUse" | "minLevel">>;

/** Updates an item. Needs a signed-in user (RLS allows updates for authenticated only). */
export async function updateInventory(id: string, patch: InventoryPatch): Promise<InventoryItem> {
  const update: Record<string, number> = {};
  if (patch.quantity !== undefined) update.quantity = patch.quantity;
  if (patch.dailyUse !== undefined) update.daily_use = patch.dailyUse;
  if (patch.minLevel !== undefined) update.min_level = patch.minLevel;
  const row = check(await getSupabase().from("inventory").update(update).eq("id", id).select().single());
  return toInventory(row as unknown as InventoryRow);
}

// ---- Alerts

export async function getAlerts(stationId?: StationId, limit = 50): Promise<Alert[]> {
  let query = getSupabase().from("alerts").select("*").order("created_at", { ascending: false }).limit(limit);
  if (stationId) query = query.eq("station_id", stationId);
  return (check(await query) as AlertRow[]).map(toAlert);
}

/** Marks an alert acknowledged. Needs a signed-in user. */
export async function acknowledgeAlert(id: string): Promise<Alert> {
  const row = check(await getSupabase().from("alerts").update({ acknowledged: true }).eq("id", id).select().single());
  return toAlert(row as unknown as AlertRow);
}

export type NewAlert = Pick<Alert, "stationId" | "system" | "severity" | "title" | "message">;

export async function createAlert(alert: NewAlert): Promise<Alert> {
  const row = check(
    await getSupabase()
      .from("alerts")
      .insert({
        station_id: alert.stationId,
        system: alert.system,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
      })
      .select()
      .single(),
  );
  return toAlert(row as unknown as AlertRow);
}

/** Calls `onAlert` for every new or updated alert. Returns an unsubscribe function. */
export function subscribeToAlerts(onAlert: (alert: Alert) => void, stationId?: StationId): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`alerts-${stationId ?? "all"}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "alerts",
        ...(stationId ? { filter: `station_id=eq.${stationId}` } : {}),
      },
      (payload) => {
        if (payload.new && "id" in payload.new) onAlert(toAlert(payload.new as AlertRow));
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

// ---- Incidents

export async function getIncidents(stationId?: StationId): Promise<Incident[]> {
  let query = getSupabase().from("incidents").select("*").order("created_at", { ascending: false });
  if (stationId) query = query.eq("station_id", stationId);
  return (check(await query) as IncidentRow[]).map(toIncident);
}

export type NewIncident = Pick<Incident, "stationId" | "title" | "description" | "severity" | "reportedBy">;

export async function createIncident(incident: NewIncident): Promise<Incident> {
  const row = check(
    await getSupabase()
      .from("incidents")
      .insert({
        station_id: incident.stationId,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        reported_by: incident.reportedBy,
      })
      .select()
      .single(),
  );
  return toIncident(row as unknown as IncidentRow);
}

// ---- Wellbeing (anonymous)

/** Daily averages of mood, sleep and energy for the last `days` days, oldest first. */
export async function getWellbeingTrend(stationId: StationId, days: number): Promise<WellbeingTrendPoint[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const rows = check(
    await getSupabase()
      .from("wellbeing_checkins")
      .select("*")
      .eq("station_id", stationId)
      .gte("created_at", since)
      .order("created_at"),
  );
  const byDay = new Map<string, WellbeingCheckin[]>();
  for (const checkin of (rows as CheckinRow[]).map(toCheckin)) {
    const date = checkin.createdAt.slice(0, 10);
    byDay.set(date, [...(byDay.get(date) ?? []), checkin]);
  }
  const avg = (items: WellbeingCheckin[], pick: (c: WellbeingCheckin) => number) =>
    Math.round((items.reduce((sum, c) => sum + pick(c), 0) / items.length) * 10) / 10;
  return [...byDay.entries()].map(([date, items]) => ({
    date,
    mood: avg(items, (c) => c.mood),
    sleepHours: avg(items, (c) => c.sleepHours),
    energy: avg(items, (c) => c.energy),
    count: items.length,
  }));
}

export type NewCheckin = Pick<WellbeingCheckin, "stationId" | "mood" | "sleepHours" | "energy">;

/** Stores an anonymous check-in; nothing identifies who sent it. */
export async function createCheckin(checkin: NewCheckin): Promise<void> {
  const { error } = await getSupabase().from("wellbeing_checkins").insert({
    station_id: checkin.stationId,
    mood: checkin.mood,
    sleep_hours: checkin.sleepHours,
    energy: checkin.energy,
  });
  if (error) throw new Error(friendlyError(error.message));
}

// ---- Compliance

export async function getComplianceLogs(stationId?: StationId, limit = 100): Promise<ComplianceLog[]> {
  let query = getSupabase().from("compliance_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (stationId) query = query.eq("station_id", stationId);
  return (check(await query) as ComplianceRow[]).map(toComplianceLog);
}

export type NewComplianceLog = Pick<ComplianceLog, "stationId" | "kind" | "amount" | "unit" | "note">;

export async function createComplianceLog(log: NewComplianceLog): Promise<ComplianceLog> {
  const row = check(
    await getSupabase()
      .from("compliance_logs")
      .insert({ station_id: log.stationId, kind: log.kind, amount: log.amount, unit: log.unit, note: log.note })
      .select()
      .single(),
  );
  return toComplianceLog(row as unknown as ComplianceRow);
}
