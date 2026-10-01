"use client";

import { useState, type FormEvent } from "react";
import { ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/dashboard/panel";
import type { NewComplianceLog } from "@/lib/data";
import type { StationId } from "@/shared/types";

const fieldClass = "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground";

/** Records a waste disposal or a spill in the compliance register. */
export function LogForm({ stationId, onSubmit }: { stationId: StationId; onSubmit: (log: NewComplianceLog) => Promise<void> }) {
  const [kind, setKind] = useState<"waste" | "spill">("waste");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const unit = kind === "waste" ? "kg" : "L";
  const value = Number(amount);
  const valid = amount !== "" && Number.isFinite(value) && value > 0 && value < 100_000;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    await onSubmit({ stationId, kind, amount: value, unit, note: note.trim() });
    setSaved(`${kind === "waste" ? "Waste" : "Spill"} of ${value} ${unit} logged.`);
    setAmount("");
    setNote("");
  };

  return (
    <Panel title="Log waste or a spill" icon={ClipboardPlus}>
      <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Type</span>
            <select className={fieldClass} value={kind} onChange={(e) => setKind(e.target.value as "waste" | "spill")}>
              <option value="waste">Waste</option>
              <option value="spill">Spill</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted-foreground">Amount ({unit})</span>
            <Input type="number" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9" required />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Note</span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder={kind === "waste" ? "e.g. Food waste incinerated" : "e.g. 4 L diesel at fuel farm, contained with pads"}
            className="h-9"
          />
        </label>
        <Button type="submit" disabled={!valid} className="h-9 self-start">
          Add to register
        </Button>
        {saved && <p className="text-sm text-success">{saved}</p>}
      </form>
    </Panel>
  );
}
