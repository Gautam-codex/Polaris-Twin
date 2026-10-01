"use client";

import { useState } from "react";
import { ArrowLeftRight, Check, Loader2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getInventory } from "@/lib/data";
import { formatNumber } from "@/shared/alerts";
import { inventoryDaysLeft } from "@/shared/predictions";
import { STATIONS } from "@/shared/stations";
import type { InventoryItem, StationId } from "@/shared/types";

/** Quantity that turns into a number input on click; Enter or blur saves, Escape cancels. */
export function EditableQuantity({ item, onSave }: { item: InventoryItem; onSave: (quantity: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(String(item.quantity))}
        className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 tabular-nums hover:bg-muted"
        aria-label={`Edit quantity of ${item.name}`}
      >
        {formatNumber(item.quantity)} {item.unit}
        <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
      </button>
    );
  }

  const commit = () => {
    const value = Number(draft);
    if (Number.isFinite(value) && value >= 0 && value !== item.quantity) onSave(value);
    setDraft(null);
  };

  return (
    <span className="inline-flex items-center gap-1">
      <Input
        autoFocus
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setDraft(null);
        }}
        className="h-7 w-24"
      />
      <Check className="size-4 text-success" />
    </span>
  );
}

type Lookup = { state: "idle" | "loading" } | { state: "done"; item: InventoryItem | null } | { state: "error"; message: string };

/** Looks up the same spare part at the other station, to arrange a transfer. */
export function OtherStationCheck({ item }: { item: InventoryItem }) {
  const other: StationId = item.stationId === "maitri" ? "bharati" : "maitri";
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });

  const load = async () => {
    setLookup({ state: "loading" });
    try {
      const items = await getInventory(other);
      setLookup({ state: "done", item: items.find((i) => i.name === item.name) ?? null });
    } catch (e) {
      setLookup({ state: "error", message: e instanceof Error ? e.message : "Lookup failed" });
    }
  };

  return (
    <Popover onOpenChange={(open) => open && void load()}>
      <PopoverTrigger className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-primary hover:bg-muted">
        <ArrowLeftRight className="size-3" /> Check {STATIONS[other].name}
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm">
        {lookup.state === "loading" && (
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking {STATIONS[other].name}…
          </span>
        )}
        {lookup.state === "error" && <span className="text-destructive">{lookup.message}</span>}
        {lookup.state === "done" &&
          (lookup.item ? (
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">{STATIONS[other].name} has {formatNumber(lookup.item.quantity)} {lookup.item.unit}</p>
              <p className="text-muted-foreground">
                {Math.floor(inventoryDaysLeft(lookup.item))} days of use left there.{" "}
                {lookup.item.quantity > lookup.item.minLevel * 1.5
                  ? "A transfer by the next helicopter or ship leg is possible."
                  : "Too close to its own minimum to spare any."}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">{STATIONS[other].name} does not stock this item.</span>
          ))}
      </PopoverContent>
    </Popover>
  );
}
