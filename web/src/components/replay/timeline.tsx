"use client";

import { Pause, Play } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { HEALTH_HEX } from "@/lib/health";
import type { Health } from "@/shared/types";

export interface TimelineMarker {
  at: number;
  severity: Exclude<Health, "ok">;
  label: string;
}

export const SPEEDS = [
  { label: "1x", minutesPerSecond: 1 },
  { label: "10x", minutesPerSecond: 10 },
  { label: "60x", minutesPerSecond: 60 },
] as const;

function utc(ms: number): string {
  return `${new Date(ms).toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/** 72 h scrubber with alert markers, play/pause and speed. */
export function Timeline({
  start,
  end,
  value,
  playing,
  speed,
  markers,
  onChange,
  onTogglePlay,
  onSpeed,
}: {
  start: number;
  end: number;
  value: number;
  playing: boolean;
  speed: number;
  markers: TimelineMarker[];
  onChange: (t: number) => void;
  onTogglePlay: () => void;
  onSpeed: (index: number) => void;
}) {
  const span = end - start;
  const minutes = Math.round((value - start) / 60_000);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Replaying: <span className="font-mono font-medium text-foreground">{utc(value)}</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Playback speed">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onSpeed(i)}
                aria-pressed={speed === i}
                className={cn("rounded px-2.5 py-0.5 text-xs", speed === i ? "bg-secondary font-medium text-primary" : "text-muted-foreground")}
              >
                {s.label}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={onTogglePlay} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause /> : <Play />}
            {playing ? "Pause" : "Play"}
          </Button>
        </div>
      </div>

      <div className="relative pt-4">
        {/* Alert markers above the track */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-3">
          {markers.map((m) => (
            <span
              key={`${m.at}-${m.label}`}
              title={`${utc(m.at)} · ${m.label}`}
              className="absolute top-0 h-3 w-0.5 -translate-x-1/2 rounded-sm"
              style={{ left: `${((m.at - start) / span) * 100}%`, background: HEALTH_HEX[m.severity] }}
            />
          ))}
        </div>
        <Slider
          value={[minutes]}
          min={0}
          max={Math.round(span / 60_000)}
          step={5}
          onValueChange={(v) => onChange(start + (Array.isArray(v) ? v[0] : v) * 60_000)}
          aria-label="Replay time"
        />
      </div>
      <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
        <span>{utc(start)}</span>
        <span>Now</span>
      </div>
      <p className="text-xs text-muted-foreground">
        1x replays 1 simulated minute per second; 60x replays 1 hour per second. Markers show warning (amber) and critical (red) alerts.
      </p>
    </div>
  );
}
