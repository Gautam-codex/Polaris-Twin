"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createComplianceLog, getComplianceLogs, type NewComplianceLog } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { complianceSummary } from "@/shared/predictions";
import { getHistory } from "@/shared/simulator";
import type { ComplianceLog, ComplianceSummary, StationId } from "@/shared/types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export interface MonthlyCo2 {
  /** YYYY-MM */
  month: string;
  co2Tonnes: number;
}

export interface ComplianceData {
  /** Simulated diesel and CO2 for the last 30 days. */
  last30: ComplianceSummary | null;
  monthly: MonthlyCo2[];
  logs: ComplianceLog[];
  loggedWasteKg: number;
  spills: { count: number; litres: number };
  loading: boolean;
  error: string | null;
}

/** Estimated CO2 for each of the last 12 complete calendar months (6-hour samples of generator burn). */
function monthlyCo2(stationId: StationId, now: number): MonthlyCo2[] {
  const d = new Date(now);
  const out: MonthlyCo2[] = [];
  for (let back = 12; back >= 1; back--) {
    const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back, 1);
    const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back + 1, 1);
    const summary = complianceSummary(getHistory(stationId, start, end, 6 * HOUR));
    out.push({ month: new Date(start).toISOString().slice(0, 7), co2Tonnes: summary.co2Tonnes });
  }
  return out;
}

/** Compliance figures for a station: simulated diesel/CO2 plus waste and spill logs from Supabase. */
export function useCompliance(stationId: StationId, now: number | null, runWrite?: (label: string, fn: () => Promise<unknown>) => Promise<void>) {
  const day = now === null ? null : Math.floor(now / DAY) * DAY;
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const last30 = useMemo(() => (day === null ? null : complianceSummary(getHistory(stationId, day - 30 * DAY, day, HOUR))), [stationId, day]);
  const monthly = useMemo(() => (day === null ? [] : monthlyCo2(stationId, day)), [stationId, day]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getComplianceLogs(stationId, 200)
      .then((rows) => {
        if (!active) return;
        setLogs(rows);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load compliance logs");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [stationId]);

  const addLog = useCallback(
    async (log: NewComplianceLog) => {
      const optimistic: ComplianceLog = { ...log, id: `pending-${Date.now()}`, createdAt: new Date().toISOString() };
      setLogs((prev) => [optimistic, ...prev]);
      const write = async () => {
        const saved = await createComplianceLog(log);
        setLogs((prev) => prev.map((l) => (l.id === optimistic.id ? saved : l)));
      };
      try {
        if (runWrite) await runWrite(`Log ${log.kind}: ${log.amount} ${log.unit}`, write);
        else await write();
      } catch (e) {
        setLogs((prev) => prev.filter((l) => l.id !== optimistic.id));
        setError(e instanceof Error ? e.message : "Could not save the log");
      }
    },
    [runWrite],
  );

  const since = day === null ? 0 : day - 30 * DAY;
  const recent = logs.filter((l) => Date.parse(l.createdAt) >= since);
  const loggedWasteKg = recent.filter((l) => l.kind === "waste").reduce((s, l) => s + l.amount, 0);
  const spillRows = recent.filter((l) => l.kind === "spill");
  const spills = { count: spillRows.length, litres: spillRows.reduce((s, l) => s + l.amount, 0) };

  const data: ComplianceData = { last30, monthly, logs, loggedWasteKg, spills, loading, error };
  return { ...data, addLog };
}
