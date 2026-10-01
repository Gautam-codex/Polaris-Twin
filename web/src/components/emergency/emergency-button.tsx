"use client";

import { useState } from "react";
import { Siren } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useT } from "@/components/language";
import { useOps } from "@/components/dashboard/ops-context";
import { useStation } from "@/components/dashboard/station-context";
import { EMERGENCY_KINDS, PLAYBOOKS, type EmergencyKind } from "@/lib/playbooks";

/** Top-bar button: pick an emergency type and confirm to switch the dashboard into emergency mode. */
export function EmergencyButton() {
  const { station, stationId } = useStation();
  const { emergency, startEmergency } = useOps();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EmergencyKind | null>(null);
  const t = useT();

  if (emergency) {
    return (
      <Button variant="destructive" className="bg-destructive text-white hover:bg-destructive/90" disabled aria-label={t("Emergency active")}>
        <Siren />
        <span className="hidden sm:inline">{t("Emergency active")}</span>
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setKind(null);
      }}
    >
      <DialogTrigger render={<Button variant="destructive" className="bg-destructive text-white hover:bg-destructive/90" aria-label={t("Emergency")} />}>
        <Siren />
        <span className="hidden sm:inline">{t("Emergency")}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Declare an emergency at {station.name}</DialogTitle>
          <DialogDescription>Choose the type. The dashboard switches to the matching checklist for every viewer of this browser.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Emergency type">
          {EMERGENCY_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-md border px-3 py-2.5 text-left transition-colors",
                kind === k ? "border-destructive bg-destructive/8" : "border-border hover:bg-muted",
              )}
            >
              <p className="text-sm font-medium text-foreground">{PLAYBOOKS[k].label}</p>
              <p className="text-xs text-muted-foreground">{PLAYBOOKS[k].summary}</p>
            </button>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t("Cancel")}</DialogClose>
          <Button
            variant="destructive"
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={!kind}
            onClick={() => {
              if (!kind) return;
              startEmergency(kind, stationId);
              setOpen(false);
            }}
          >
            {t("Confirm emergency")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
