"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MousePointerClick, RotateCcw, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStation } from "@/components/dashboard/station-context";
import { HEALTH_HEX, HEALTH_LABEL } from "@/lib/health";
import type { Health } from "@/shared/types";
import { BuildingPanel } from "./building-panel";
import { WIND_FROM_DEG } from "./weather-effects";

export function SceneLoading() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading 3D twin…
    </div>
  );
}

const TwinScene = dynamic(() => import("./twin-scene"), { ssr: false, loading: SceneLoading });

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function compass(deg: number): string {
  return COMPASS[Math.round(deg / 45) % 8];
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
      {(Object.keys(HEALTH_HEX) as Health[]).map((h) => (
        <span key={h} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: HEALTH_HEX[h] }} />
          {HEALTH_LABEL[h]}
          {h === "critical" && " (pulsing)"}
        </span>
      ))}
    </div>
  );
}

/** Full-page 3D twin with overlays and a side panel for the selected building. */
export function TwinView() {
  const { snapshot, history, stationId } = useStation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const selected = snapshot?.buildings.find((b) => b.id === selectedId) ?? null;
  const fromDeg = WIND_FROM_DEG[stationId];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="relative h-[60vh] min-h-[420px] flex-1 overflow-hidden rounded-lg border border-border bg-card">
        {snapshot ? (
          <TwinScene snapshot={snapshot} selectedId={selectedId} onSelect={setSelectedId} resetKey={resetKey} />
        ) : (
          <SceneLoading />
        )}
        {snapshot && (
          <>
            <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              <Wind className="size-4 text-muted-foreground" />
              <span>
                Wind <span className="font-medium text-foreground">{snapshot.weather.windKph} km/h</span> from {compass(fromDeg)}
              </span>
            </div>
            <Button variant="outline" size="sm" className="absolute top-3 right-3 bg-card" onClick={() => setResetKey((k) => k + 1)}>
              <RotateCcw /> Reset view
            </Button>
            <div className="absolute bottom-3 left-3">
              <Legend />
            </div>
          </>
        )}
      </div>
      <div className="w-full lg:w-80">
        {selected && snapshot ? (
          <BuildingPanel building={selected} snapshot={snapshot} history={history} onClose={() => setSelectedId(null)} />
        ) : (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <MousePointerClick className="size-5 text-muted-foreground" />
            Click a building to see its live readings. Drag to orbit, scroll to zoom.
          </div>
        )}
      </div>
    </div>
  );
}
