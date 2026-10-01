"use client";

import { Badge } from "@/components/ui/badge";
import { useNow } from "@/hooks/useNow";
import { useStation } from "./station-context";

function formatTime(ms: number, offsetHours: number): string {
  return new Date(ms + offsetHours * 3_600_000).toISOString().slice(11, 19);
}

/** Live UTC clock plus approximate station local time (longitude / 15, rounded). */
export function Clocks() {
  const now = useNow(1000);
  const { station } = useStation();
  const offset = Math.round(station.lon / 15);
  return (
    <div className="flex items-center gap-3 font-mono text-xs tabular-nums text-muted-foreground">
      <span>
        <span className="text-foreground">{now ? formatTime(now, 0) : "--:--:--"}</span> UTC
      </span>
      <span className="hidden sm:inline">
        <span className="text-foreground">{now ? formatTime(now, offset) : "--:--:--"}</span> {station.name} (UTC+{offset})
      </span>
    </div>
  );
}

/** Seconds since the last snapshot from the station. */
export function SyncPill() {
  const now = useNow(1000);
  const { snapshot } = useStation();
  const seconds = now && snapshot ? Math.max(0, Math.round((now - snapshot.timestamp) / 1000)) : null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-success" />
      {seconds === null ? "Syncing…" : `Synced ${seconds}s ago`}
    </span>
  );
}

export function SimulatedBadge() {
  return (
    <Badge variant="outline" className="rounded border-border font-normal text-muted-foreground">
      Simulated sensor feed
    </Badge>
  );
}
