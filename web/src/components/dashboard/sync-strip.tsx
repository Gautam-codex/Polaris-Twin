"use client";

import { Clock, Gauge } from "lucide-react";
import { useOps } from "./ops-context";
import { useStation } from "./station-context";
import type { StationSnapshot } from "@/shared/types";

/** 24 h of 5 s readings: what a cloud-first twin would pull to rebuild its state. */
const FULL_SYNC_SAMPLES = 17_280;

function flatten(value: unknown, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out[prefix] = value;
  }
  return out;
}

/** Only the fields that changed since the previous sync. */
function deltaBytes(prev: StationSnapshot | undefined, next: StationSnapshot): number {
  if (!prev) return JSON.stringify(next).length;
  const a = flatten(prev);
  const b = flatten(next);
  const changed: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(b)) if (a[k] !== v) changed[k] = v;
  return JSON.stringify(changed).length;
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Edge-sync status: payload size in low-bandwidth mode and the queue of changes waiting for the link. */
export function SyncStrip() {
  const { lowBandwidth, linkDown, queue, lastSyncError } = useOps();
  const { snapshot, history } = useStation();
  if (!snapshot || (!lowBandwidth && !linkDown && queue.length === 0 && !lastSyncError)) return null;

  const delta = deltaBytes(history.at(-2), snapshot);
  const full = JSON.stringify(snapshot).length * FULL_SYNC_SAMPLES;

  return (
    <section className="mb-6 rounded-lg border border-border bg-card px-5 py-3 text-sm">
      {lowBandwidth && (
        <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <Gauge className="size-4" />
          Low-bandwidth mode · refresh every 60 s · payload this sync:
          <span className="font-medium text-foreground">{kb(delta)} (delta)</span>
          vs <span className="font-medium text-foreground">{mb(full)} (full)</span>
        </p>
      )}
      {(linkDown || queue.length > 0) && (
        <div className={lowBandwidth ? "mt-3 border-t border-border pt-3" : undefined}>
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Clock className="size-4 text-muted-foreground" />
            Sync queue: {queue.length} change{queue.length === 1 ? "" : "s"} waiting
            {linkDown ? " for the satellite link" : " — syncing now"}
          </p>
          {queue.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-muted-foreground">
              {queue.map((c) => (
                <li key={c.id} className="flex justify-between gap-3">
                  <span>{c.label}</span>
                  <span className="font-mono text-xs">{new Date(c.queuedAt).toISOString().slice(11, 19)} UTC</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {lastSyncError && <p className="mt-2 text-destructive">Last sync error: {lastSyncError}</p>}
    </section>
  );
}
