"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createAlert } from "@/lib/data";
import { setFault, setWeatherOverride } from "@/shared/simulator";
import { STATION_IDS } from "@/shared/stations";
import type { StationId } from "@/shared/types";

const FAULT_ALERT_DELAY_MS = 30_000;
const BLIZZARD_MS = 3 * 60_000;

export interface QueuedChange {
  id: number;
  label: string;
  queuedAt: number;
  run: () => Promise<unknown>;
}

interface OpsContextValue {
  /** Simulated satellite link outage: writes wait in the sync queue. */
  linkDown: boolean;
  setLinkDown: (down: boolean) => void;
  queue: QueuedChange[];
  lastSyncError: string | null;
  /** Runs a Supabase write now, or queues it while the link is down. */
  runOrQueue: (label: string, run: () => Promise<unknown>) => Promise<void>;
  demo: {
    injectFault: () => void;
    triggerBlizzard: (stationId: StationId) => void;
    clearAll: () => void;
    faultPending: boolean;
  };
}

const OpsContext = createContext<OpsContextValue | null>(null);

/** Station-wide operating state shared by every dashboard page. */
export function OpsProvider({ children }: { children: ReactNode }) {
  const [linkDown, setLinkDownState] = useState(false);
  const [queue, setQueue] = useState<QueuedChange[]>([]);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [faultPending, setFaultPending] = useState(false);
  const nextId = useRef(1);
  const linkDownRef = useRef(false);
  const faultTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<QueuedChange[]>([]);

  const updateQueue = useCallback((next: (q: QueuedChange[]) => QueuedChange[]) => {
    queueRef.current = next(queueRef.current);
    setQueue(queueRef.current);
  }, []);

  const runOrQueue = useCallback(async (label: string, run: () => Promise<unknown>) => {
    if (linkDownRef.current) {
      const change = { id: nextId.current++, label, queuedAt: Date.now(), run };
      updateQueue((q) => [...q, change]);
      return;
    }
    await run();
  }, [updateQueue]);

  const flush = useCallback(async (items: QueuedChange[]) => {
    for (const item of items) {
      try {
        await item.run();
        setLastSyncError(null);
      } catch (e) {
        setLastSyncError(`${item.label}: ${e instanceof Error ? e.message : "sync failed"}`);
      }
      updateQueue((q) => q.filter((x) => x.id !== item.id));
    }
  }, [updateQueue]);

  const setLinkDown = useCallback(
    (down: boolean) => {
      linkDownRef.current = down;
      setLinkDownState(down);
      if (!down && queueRef.current.length > 0) void flush([...queueRef.current]);
    },
    [flush],
  );

  const injectFault = useCallback(() => {
    setFault("maitri", "dg-1");
    setFaultPending(true);
    if (faultTimer.current) clearTimeout(faultTimer.current);
    faultTimer.current = setTimeout(() => {
      setFaultPending(false);
      void runOrQueue("Critical alert: Maitri Generator 1", () =>
        createAlert({
          stationId: "maitri",
          system: "power",
          severity: "critical",
          title: "Generator 1 coolant and vibration anomaly",
          message: "Predictive maintenance flagged Generator 1 at Maitri. Shift load to the standby generator and inspect the cooling system.",
        }),
      ).catch((e: unknown) => setLastSyncError(e instanceof Error ? e.message : "Could not raise alert"));
    }, FAULT_ALERT_DELAY_MS);
  }, [runOrQueue]);

  const triggerBlizzard = useCallback((stationId: StationId) => {
    setWeatherOverride(stationId, { windKph: 85, visibilityKm: 0.2 }, BLIZZARD_MS);
  }, []);

  const clearAll = useCallback(() => {
    if (faultTimer.current) clearTimeout(faultTimer.current);
    setFaultPending(false);
    for (const id of STATION_IDS) {
      setFault(id, null);
      setWeatherOverride(id, null);
    }
    setLinkDown(false);
  }, [setLinkDown]);

  useEffect(() => () => {
    if (faultTimer.current) clearTimeout(faultTimer.current);
  }, []);

  const value = useMemo(
    () => ({
      linkDown,
      setLinkDown,
      queue,
      lastSyncError,
      runOrQueue,
      demo: { injectFault, triggerBlizzard, clearAll, faultPending },
    }),
    [linkDown, setLinkDown, queue, lastSyncError, runOrQueue, injectFault, triggerBlizzard, clearAll, faultPending],
  );

  return <OpsContext.Provider value={value}>{children}</OpsContext.Provider>;
}

export function useOps(): OpsContextValue {
  const value = useContext(OpsContext);
  if (!value) throw new Error("useOps must be used inside <OpsProvider>");
  return value;
}
