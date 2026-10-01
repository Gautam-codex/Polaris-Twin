"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { BellRing, Boxes } from "lucide-react";
import { cn } from "cn";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { StatCards } from "@/components/overview/stat-cards";
import { SPEEDS, Timeline, type TimelineMarker } from "@/components/replay/timeline";
import { SceneLoading } from "@/components/twin/twin-view";
import { useAlerts } from "@/hooks/useSupabaseList";
import { SEVERITY_STYLE } from "@/lib/health";
import { getSnapshot } from "@/shared/simulator";
import type { Alert } from "@/shared/types";

const TwinScene = dynamic(() => import("@/components/twin/twin-scene"), { ssr: false, loading: SceneLoading });

const HOUR = 3_600_000;
const SPAN = 72 * HOUR;
const MARKER_STEP = 15 * 60_000;
const ACTIVE_WINDOW = 6 * HOUR;
const FRAME_MS = 250;

export default function ReplayPage() {
  const { stationId, station, snapshot } = useStation();
  const stored = useAlerts(stationId);
  const hour = snapshot ? Math.floor(snapshot.timestamp / HOUR) * HOUR : null;
  const end = hour === null ? 0 : hour + HOUR;
  const start = end - SPAN;
  const [time, setTime] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const t = time ?? start;

  // Sensor alerts every 15 minutes across the window, plus stored alerts, as timeline markers.
  const markers = useMemo<TimelineMarker[]>(() => {
    if (hour === null) return [];
    const out: TimelineMarker[] = [];
    for (let at = start; at <= end; at += MARKER_STEP) {
      const s = getSnapshot(stationId, at);
      const worst = s.alerts.find((a) => a.severity === "critical") ?? s.alerts.find((a) => a.severity === "warning");
      if (worst && worst.severity !== "info") out.push({ at, severity: worst.severity, label: worst.title });
    }
    for (const a of stored.items) {
      const at = Date.parse(a.createdAt);
      if (at >= start && at <= end && a.severity !== "info") out.push({ at, severity: a.severity, label: a.title });
    }
    return out;
  }, [stationId, hour, start, end, stored.items]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTime((prev) => {
        const next = (prev ?? start) + SPEEDS[speed].minutesPerSecond * 60_000 * (FRAME_MS / 1000);
        if (next >= end) {
          setPlaying(false);
          return end;
        }
        return next;
      });
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [playing, speed, start, end]);

  const at = useMemo(() => (hour === null ? null : getSnapshot(stationId, Math.min(t, end))), [stationId, t, end, hour]);
  const activeStored: Alert[] = stored.items.filter((a) => {
    const created = Date.parse(a.createdAt);
    return created <= t && created > t - ACTIVE_WINDOW;
  });
  const active = at ? [...at.alerts, ...activeStored] : [];

  return (
    <>
      <PageHeader title="Replay" description={`Scrub back through the last 72 hours at ${station.name} to review what happened and when.`} />
      {!at || hour === null ? (
        <p className="text-sm text-muted-foreground">Connecting to station feed…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Timeline
            start={start}
            end={end}
            value={Math.min(t, end)}
            playing={playing}
            speed={speed}
            markers={markers}
            onChange={(v) => {
              setTime(v);
              setPlaying(false);
            }}
            onTogglePlay={() => {
              if (!playing && t >= end) setTime(start);
              setPlaying((p) => !p);
            }}
            onSpeed={setSpeed}
          />
          <StatCards at={at} />
          <div className="grid gap-4 xl:grid-cols-3">
            <Panel title="Station at this moment" icon={Boxes} className="xl:col-span-2">
              <div className="h-72 overflow-hidden rounded-md border border-border">
                <TwinScene snapshot={at} mode="preview" />
              </div>
            </Panel>
            <Panel title="Alerts active at this time" icon={BellRing}>
              {active.length === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts were active.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {active.map((a) => (
                    <li key={a.id} className="rounded-md border border-border p-3">
                      <span className={cn("rounded border px-2 py-0.5 text-[11px] font-medium capitalize", SEVERITY_STYLE[a.severity])}>
                        {a.severity}
                      </span>
                      <p className="mt-1.5 text-sm font-medium text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
