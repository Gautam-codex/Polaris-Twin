"use client";

import { useEffect, useRef, useState } from "react";
import { Siren } from "lucide-react";
import { subscribeToAlerts } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { STATIONS } from "@/shared/stations";
import type { Alert } from "@/shared/types";

const SHOW_MS = 2_000;

/** Bottom-right pop-up for 2 seconds whenever the crew app raises an SOS (any station). */
export function SosToast() {
  const [alert, setAlert] = useState<Alert | null>(null);
  const seen = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const unsubscribe = subscribeToAlerts((a) => {
      const fresh = Date.now() - new Date(a.createdAt).getTime() < 60_000;
      if (!a.title.startsWith("SOS") || a.acknowledged || !fresh || seen.current.has(a.id)) return;
      seen.current.add(a.id);
      setAlert(a);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setAlert(null), SHOW_MS);
    });
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!alert) return null;
  return (
    <div
      role="alert"
      className="fixed right-4 bottom-20 z-50 w-80 animate-in rounded-lg border border-destructive/40 bg-card p-4 shadow-lg fade-in-0 slide-in-from-bottom-4 md:right-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive text-white">
          <Siren className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-destructive">{alert.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{STATIONS[alert.stationId].name} · crew app</p>
        </div>
      </div>
    </div>
  );
}
