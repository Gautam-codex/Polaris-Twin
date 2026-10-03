"use client";

import { useState } from "react";
import { BellRing, CheckCheck } from "lucide-react";
import { cn } from "cn";
import { AlertRow } from "@/components/alerts/alert-row";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { useAlerts } from "@/hooks/useSupabaseList";

type Tab = "open" | "done";

/** All alerts for the station in two sections: unacknowledged (with Acknowledge) and acknowledged. */
export default function AlertsPage() {
  const { snapshot, station, stationId } = useStation();
  const { items, loading, error, acknowledge } = useAlerts(stationId, 100);
  const [tab, setTab] = useState<Tab>("open");
  const live = snapshot?.alerts ?? [];
  const open = items.filter((a) => !a.acknowledged);
  const done = items.filter((a) => a.acknowledged);
  const counts: Record<Tab, number> = { open: live.length + open.length, done: done.length };

  return (
    <>
      <PageHeader
        title="Alerts"
        description={`${station.name}: every alert from the station sensors and the crew app. Only the control room can acknowledge.`}
      />
      <div className="mb-4 inline-flex rounded-md border border-border bg-card p-0.5" role="tablist">
        {(["open", "done"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 rounded px-4 py-1.5 text-sm transition-colors",
              tab === key ? "bg-secondary font-medium text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {key === "open" ? <BellRing className="size-4" /> : <CheckCheck className="size-4" />}
            {key === "open" ? "Unacknowledged" : "Acknowledged"}
            <span className="rounded bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">{counts[key]}</span>
          </button>
        ))}
      </div>

      <Panel title={tab === "open" ? "Unacknowledged" : "Acknowledged"} icon={tab === "open" ? BellRing : CheckCheck}>
        <ul className="flex flex-col gap-2">
          {loading && <li className="text-sm text-muted-foreground">Loading alerts…</li>}
          {error && <li className="text-sm text-destructive">{error}</li>}
          {tab === "open" && (
            <>
              {live.map((a) => (
                <AlertRow key={a.id} alert={a} live />
              ))}
              {open.map((a) => (
                <AlertRow key={a.id} alert={a} onAck={() => void acknowledge(a.id)} />
              ))}
              {!loading && counts.open === 0 && <li className="text-sm text-muted-foreground">Everything has been acknowledged.</li>}
            </>
          )}
          {tab === "done" && (
            <>
              {done.map((a) => (
                <AlertRow key={a.id} alert={a} />
              ))}
              {!loading && done.length === 0 && <li className="text-sm text-muted-foreground">No acknowledged alerts yet.</li>}
            </>
          )}
        </ul>
      </Panel>
    </>
  );
}
