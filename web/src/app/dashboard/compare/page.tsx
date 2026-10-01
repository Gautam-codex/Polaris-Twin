"use client";

import { GitCompareArrows, Map as MapIcon } from "lucide-react";
import { cn } from "cn";
import { AntarcticaMap } from "@/components/compare/antarctica-map";
import { useStationMetrics, type StationMetrics } from "@/components/compare/station-metrics";
import { useOps } from "@/components/dashboard/ops-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { useStationSnapshot } from "@/hooks/useStationSnapshot";
import { HEALTH_LABEL, HEALTH_STYLE } from "@/lib/health";
import { STATIONS } from "@/shared/stations";

type Better = "higher" | "lower" | null;

interface Row {
  label: string;
  value: (m: StationMetrics) => number | null;
  format: (v: number) => string;
  better: Better;
  note?: string;
}

const ROWS: Row[] = [
  { label: "Fuel runway", value: (m) => m.runwayDays, format: (v) => `${Math.floor(v)} days`, better: "higher" },
  { label: "Reserve at resupply", value: (m) => m.marginDays, format: (v) => `${Math.round(v)} days`, better: "higher" },
  { label: "Power load", value: (m) => m.loadKw, format: (v) => `${v.toFixed(0)} kW`, better: null },
  { label: "Field safety index", value: (m) => m.safety, format: (v) => `${v} / 100`, better: "higher" },
  { label: "Crew wellbeing (mood)", value: (m) => m.wellbeing, format: (v) => `${v.toFixed(1)} / 5`, better: "higher", note: "14-day anonymous average" },
  { label: "CO₂, last 30 days", value: (m) => m.co2Tonnes, format: (v) => `${v.toFixed(1)} t`, better: "lower", note: "estimated from diesel" },
  { label: "Open alerts", value: (m) => m.openAlerts, format: (v) => String(v), better: "lower" },
];

function winner(row: Row, a: number | null, b: number | null): "a" | "b" | null {
  if (row.better === null || a === null || b === null || a === b) return null;
  const aWins = row.better === "higher" ? a > b : a < b;
  return aWins ? "a" : "b";
}

export default function ComparePage() {
  const { lowBandwidth } = useOps();
  const tick = lowBandwidth ? 60_000 : 5_000;
  const maitri = useStationSnapshot("maitri", tick);
  const bharati = useStationSnapshot("bharati", tick);
  const m = useStationMetrics("maitri", maitri.snapshot);
  const b = useStationMetrics("bharati", bharati.snapshot);

  return (
    <>
      <PageHeader title="Compare stations" description="Maitri and Bharati side by side, from the same simulated sensor feed." />
      <div className="grid gap-4 xl:grid-cols-5">
        <Panel title="Side by side" icon={GitCompareArrows} className="xl:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-2.5 pr-4 font-medium text-muted-foreground">Metric</th>
                  <th className="py-2.5 pr-4 text-right font-medium">{STATIONS.maitri.name}</th>
                  <th className="py-2.5 text-right font-medium">{STATIONS.bharati.name}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2.5 pr-4 text-muted-foreground">Overall health</td>
                  {[m, b].map((x, i) => (
                    <td key={i} className={cn("py-2.5 text-right", i === 0 && "pr-4")}>
                      {x.health ? (
                        <span className={cn("rounded border px-2 py-0.5 text-xs font-medium", HEALTH_STYLE[x.health])}>{HEALTH_LABEL[x.health]}</span>
                      ) : (
                        "…"
                      )}
                    </td>
                  ))}
                </tr>
                {ROWS.map((row) => {
                  const av = row.value(m);
                  const bv = row.value(b);
                  const win = winner(row, av, bv);
                  return (
                    <tr key={row.label} className="border-b border-border">
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {row.label}
                        {row.note && <span className="block text-xs">{row.note}</span>}
                      </td>
                      <td className={cn("py-2.5 pr-4 text-right tabular-nums", win === "a" && "font-medium text-primary")}>
                        {av === null ? "…" : row.format(av)}
                      </td>
                      <td className={cn("py-2.5 text-right tabular-nums", win === "b" && "font-medium text-primary")}>
                        {bv === null ? "…" : row.format(bv)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">The better value in each row is shown in blue.</p>
        </Panel>
        <Panel title="Stations and control room" icon={MapIcon} className="xl:col-span-2">
          <AntarcticaMap />
          <p className="mt-3 text-xs text-muted-foreground">
            Dashed lines: satellite links from each station to the NCPOR control room in Goa.
          </p>
        </Panel>
      </div>
    </>
  );
}
