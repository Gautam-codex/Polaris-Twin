"use client";

import { PackageX, Ship } from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { useInventory } from "@/hooks/useSupabaseList";
import { formatNumber } from "@/shared/alerts";
import { inventoryDaysLeft, itemsAtRisk, nextResupplyDate } from "@/shared/predictions";

const DAY = 86_400_000;

export function ResupplyCountdown() {
  const { snapshot } = useStation();
  if (!snapshot) return null;
  const resupply = nextResupplyDate(snapshot.timestamp);
  const days = Math.ceil((resupply.getTime() - snapshot.timestamp) / DAY);
  return (
    <Panel title="Next resupply (ISEA ship)" icon={Ship}>
      <p className="text-4xl font-medium tabular-nums text-primary">
        {days}
        <span className="ml-2 text-base font-normal text-muted-foreground">days</span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Expected {resupply.toISOString().slice(0, 10)}, at the start of the austral summer season.
      </p>
    </Panel>
  );
}

export function AtRiskCard() {
  const { snapshot, stationId } = useStation();
  const { items, loading, error } = useInventory(stationId);
  const now = snapshot?.timestamp ?? null;
  const risk = now === null ? [] : itemsAtRisk(items, nextResupplyDate(now), now);

  return (
    <Panel
      title="At risk before resupply"
      icon={PackageX}
      action={<span className="text-xs text-muted-foreground">{risk.length} items</span>}
    >
      {loading && <p className="text-sm text-muted-foreground">Loading inventory…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && !error && risk.length === 0 && (
        <p className="text-sm text-muted-foreground">Every item lasts until the ship arrives.</p>
      )}
      <ul className="flex flex-col divide-y divide-border">
        {risk.map((item) => {
          const daysLeft = inventoryDaysLeft(item);
          return (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(item.quantity)} {item.unit} · {item.dailyUse} {item.unit}/day
                </p>
              </div>
              <span className={daysLeft < 30 ? "text-sm font-medium text-destructive" : "text-sm font-medium text-warning"}>
                {Math.floor(daysLeft)} d
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
