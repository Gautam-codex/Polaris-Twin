"use client";

import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { AlertRow } from "@/components/alerts/alert-row";
import { useAlerts } from "@/hooks/useSupabaseList";

const SHOWN = 4;

/** Unacknowledged alerts only (live sensor + stored), no scrolling; the rest are on the Alerts page. */
export function AlertsCard() {
  const { snapshot, stationId, withStation } = useStation();
  const { items, loading, error, acknowledge } = useAlerts(stationId);
  const live = snapshot?.alerts ?? [];
  const open = items.filter((a) => !a.acknowledged);
  const total = live.length + open.length;
  const shownLive = live.slice(0, SHOWN);
  const shownStored = open.slice(0, Math.max(0, SHOWN - shownLive.length));
  const hidden = total - shownLive.length - shownStored.length;

  return (
    <Panel
      title="Alerts"
      icon={BellRing}
      action={
        <Link href={withStation("/dashboard/alerts")} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {total} unacknowledged <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      <ul className="flex flex-col gap-2">
        {shownLive.map((a) => (
          <AlertRow key={a.id} alert={a} live />
        ))}
        {loading && <li className="text-sm text-muted-foreground">Loading alerts…</li>}
        {error && <li className="text-sm text-destructive">{error}</li>}
        {!loading && !error && total === 0 && <li className="text-sm text-muted-foreground">Everything has been acknowledged.</li>}
        {shownStored.map((a) => (
          <AlertRow key={a.id} alert={a} onAck={() => void acknowledge(a.id)} />
        ))}
      </ul>
      <Link
        href={withStation("/dashboard/alerts")}
        className="mt-3 flex items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-medium text-primary transition-colors hover:bg-muted"
      >
        {hidden > 0 ? `View all alerts (${hidden} more)` : "View all alerts"} <ArrowRight className="size-3.5" />
      </Link>
    </Panel>
  );
}
