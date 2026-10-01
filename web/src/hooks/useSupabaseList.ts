"use client";

import { useCallback, useEffect, useState } from "react";
import { acknowledgeAlert, getAlerts, getInventory, subscribeToAlerts, updateInventory } from "@/lib/data";
import { useOps } from "@/components/dashboard/ops-context";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Alert, InventoryItem, StationId } from "@/shared/types";

interface ListState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

/** Stored alerts for a station, kept live with Supabase realtime. */
export function useAlerts(stationId: StationId) {
  const { runOrQueue } = useOps();
  const [state, setState] = useState<ListState<Alert>>({ items: [], loading: isSupabaseConfigured, error: null });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getAlerts(stationId, 20)
      .then((items) => active && setState({ items, loading: false, error: null }))
      .catch((e: unknown) => active && setState({ items: [], loading: false, error: message(e) }));
    const unsubscribe = subscribeToAlerts((alert) => {
      setState((prev) => {
        const rest = prev.items.filter((a) => a.id !== alert.id);
        const items = [alert, ...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
        return { ...prev, items };
      });
    }, stationId);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [stationId]);

  const acknowledge = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, items: prev.items.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) }));
    try {
      await runOrQueue("Acknowledge alert", () => acknowledgeAlert(id));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        error: message(e),
        items: prev.items.map((a) => (a.id === id ? { ...a, acknowledged: false } : a)),
      }));
    }
  }, [runOrQueue]);

  return { ...state, acknowledge };
}

/** Inventory rows for a station from Supabase, with an optimistic quantity update. */
export function useInventory(stationId: StationId) {
  const { runOrQueue } = useOps();
  const [state, setState] = useState<ListState<InventoryItem>>({ items: [], loading: isSupabaseConfigured, error: null });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getInventory(stationId)
      .then((items) => active && setState({ items, loading: false, error: null }))
      .catch((e: unknown) => active && setState({ items: [], loading: false, error: message(e) }));
    return () => {
      active = false;
    };
  }, [stationId]);

  /** Saves a new quantity; reverts and reports the error if Supabase rejects it. */
  const setQuantity = useCallback(async (id: string, quantity: number) => {
    let previous: number | undefined;
    setState((prev) => ({
      ...prev,
      error: null,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;
        previous = item.quantity;
        return { ...item, quantity };
      }),
    }));
    try {
      await runOrQueue(`Set quantity to ${quantity}`, () => updateInventory(id, { quantity }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        error: message(e),
        items: prev.items.map((item) => (item.id === id && previous !== undefined ? { ...item, quantity: previous } : item)),
      }));
    }
  }, [runOrQueue]);

  return { ...state, setQuantity };
}
