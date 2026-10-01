"use client";

import { useMemo, useState } from "react";
import { Boxes, Search } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Panel } from "@/components/dashboard/panel";
import { useInventory } from "@/hooks/useSupabaseList";
import { inventoryDaysLeft, itemsAtRisk } from "@/shared/predictions";
import type { InventoryCategory, StationId } from "@/shared/types";
import { EditableQuantity, OtherStationCheck } from "./inventory-cells";

const CATEGORIES: ("all" | InventoryCategory)[] = ["all", "fuel", "food", "medical", "spares", "science"];

/** Supabase inventory with search, category filter, days left, inline edit and at-risk rows. */
export function InventoryTable({ stationId, resupplyDate, now }: { stationId: StationId; resupplyDate: Date; now: number }) {
  const { items, loading, error, setQuantity } = useInventory(stationId);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");

  const atRisk = useMemo(() => new Set(itemsAtRisk(items, resupplyDate, now).map((i) => i.id)), [items, resupplyDate, now]);
  const rows = items.filter(
    (i) => (category === "all" || i.category === category) && i.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Panel
      title="Inventory"
      icon={Boxes}
      action={<span className="text-xs text-muted-foreground">{atRisk.size} at risk before resupply</span>}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items" className="h-9 pl-8" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded border px-3 py-1 text-xs capitalize transition-colors",
                category === c ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading inventory…</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Daily use</TableHead>
                <TableHead className="text-right">Days left</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => {
                const risk = atRisk.has(item.id);
                const days = inventoryDaysLeft(item);
                return (
                  <TableRow key={item.id} className={cn(risk && "bg-warning/10 hover:bg-warning/15")}>
                    <TableCell className="font-medium">
                      {item.name}
                      {risk && <span className="ml-2 rounded-full border border-warning/40 px-1.5 py-0.5 text-[10px] text-warning">at risk</span>}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{item.category}</TableCell>
                    <TableCell>
                      <EditableQuantity item={item} onSave={(q) => void setQuantity(item.id, q, item.name)} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {item.dailyUse} {item.unit}
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums", risk ? "font-medium text-warning" : "text-foreground")}>
                      {Number.isFinite(days) ? Math.floor(days) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{item.category === "spares" && <OtherStationCheck item={item} />}</TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    No items match.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </Panel>
  );
}
