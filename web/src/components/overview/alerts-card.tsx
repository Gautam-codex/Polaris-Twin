"use client";

import { BellRing, Check, Radio } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { useAlerts } from "@/hooks/useSupabaseList";
import { SEVERITY_STYLE } from "@/lib/health";
import type { Alert } from "@/shared/types";

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function AlertRow({ alert, live, onAck }: { alert: Alert; live?: boolean; onAck?: () => void }) {
  return (
    <li className={cn("rounded-xl border border-border p-3", alert.acknowledged && "opacity-55")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize", SEVERITY_STYLE[alert.severity])}>
              {alert.severity}
            </span>
            {live && (
              <span className="flex items-center gap-1 text-[11px] text-warning">
                <Radio className="size-3" /> live sensor
              </span>
            )}
            <span className="text-xs text-muted-foreground">{live ? "now" : timeAgo(alert.createdAt)}</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-foreground">{alert.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{alert.message}</p>
        </div>
        {onAck &&
          (alert.acknowledged ? (
            <span className="flex shrink-0 items-center gap-1 text-xs text-success">
              <Check className="size-3.5" /> Ack
            </span>
          ) : (
            <Button size="sm" variant="outline" className="shrink-0" onClick={onAck}>
              Acknowledge
            </Button>
          ))}
      </div>
    </li>
  );
}

/** Live sensor alerts from the simulator plus stored alerts from Supabase (realtime). */
export function AlertsCard() {
  const { snapshot, stationId } = useStation();
  const { items, loading, error, acknowledge } = useAlerts(stationId);
  const live = snapshot?.alerts ?? [];
  const open = items.filter((a) => !a.acknowledged).length;

  return (
    <Panel
      title="Alerts"
      icon={BellRing}
      action={<span className="text-xs text-muted-foreground">{open} unacknowledged</span>}
      className="max-h-[520px]"
    >
      <ul className="-mr-2 flex flex-col gap-2 overflow-y-auto pr-2">
        {live.map((a) => (
          <AlertRow key={a.id} alert={a} live />
        ))}
        {loading && <li className="text-sm text-muted-foreground">Loading alerts…</li>}
        {error && <li className="text-sm text-destructive">{error}</li>}
        {!loading && !error && items.length === 0 && live.length === 0 && (
          <li className="text-sm text-muted-foreground">No alerts for this station.</li>
        )}
        {items.map((a) => (
          <AlertRow key={a.id} alert={a} onAck={() => void acknowledge(a.id)} />
        ))}
      </ul>
    </Panel>
  );
}
