import { useCallback, useEffect, useState } from "react";
import { AppState, Vibration } from "react-native";
import { useSync } from "@/context/sync";
import { getAlerts, getInventory, subscribeToAlerts } from "@/lib/data";
import { notify } from "@/lib/notifications";
import type { Alert, InventoryItem, StationId } from "@shared/types";

interface ListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

const POLL_MS = 30_000;

/** Station alerts from Supabase, kept live (new alerts vibrate and notify; acknowledgements from the website update in place). */
export function useAlerts(stationId: StationId, { notifyOnInsert = false } = {}) {
  const [state, setState] = useState<ListState<Alert>>({ items: [], loading: true, error: null });

  const load = useCallback(async () => {
    try {
      const items = await getAlerts(stationId);
      setState({ items, loading: false, error: null });
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false, error: message(e) }));
    }
  }, [stationId]);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToAlerts(stationId, (alert, inserted) => {
      setState((prev) => ({ ...prev, items: [alert, ...prev.items.filter((a) => a.id !== alert.id)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }));
      if (inserted && notifyOnInsert) {
        Vibration.vibrate(alert.severity === "critical" ? [0, 400, 200, 400] : 300);
        void notify(`${alert.severity === "critical" ? "Critical" : "New"} alert: ${alert.title}`, alert.message);
      }
    });
    // Phones drop the realtime connection in the background, so also re-check regularly and on return.
    const poll = setInterval(() => void load(), POLL_MS);
    const appState = AppState.addEventListener("change", (s) => s === "active" && void load());
    return () => {
      unsubscribe();
      clearInterval(poll);
      appState.remove();
    };
  }, [stationId, load, notifyOnInsert]);

  return { ...state, reload: load };
}

/** Station inventory with queued quantity edits. */
export function useInventory(stationId: StationId) {
  const { submit } = useSync();
  const [state, setState] = useState<ListState<InventoryItem>>({ items: [], loading: true, error: null });

  const load = useCallback(async () => {
    try {
      const items = await getInventory(stationId);
      setState({ items, loading: false, error: null });
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false, error: message(e) }));
    }
  }, [stationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const setQuantity = useCallback(
    async (item: InventoryItem, quantity: number) => {
      const next = Math.max(0, Math.round(quantity));
      setState((prev) => ({ ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, quantity: next } : i)) }));
      await submit({ kind: "setQuantity", id: item.id, quantity: next, name: item.name });
    },
    [submit],
  );

  return { ...state, reload: load, setQuantity };
}
