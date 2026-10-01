"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, Siren } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getSupabase } from "@/lib/supabase";
import { STATION_IDS, STATIONS } from "@/shared/stations";
import { DemoControls } from "./demo-controls";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar";
import { Clocks, SimulatedBadge, SyncPill } from "./status-bits";
import { useStation } from "./station-context";

function StationSwitcher() {
  const { stationId, setStation } = useStation();
  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5" role="group" aria-label="Station">
      {STATION_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setStation(id)}
          aria-pressed={stationId === id}
          className={cn(
            "rounded px-3 py-1 text-sm transition-colors",
            stationId === id ? "bg-secondary font-medium text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {STATIONS[id].name}
        </button>
      ))}
    </div>
  );
}

function EmergencyButton() {
  const { station } = useStation();
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" className="bg-destructive text-white hover:bg-destructive/90" />}>
        <Siren />
        <span className="hidden sm:inline">Emergency</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Declare an emergency at {station.name}?</DialogTitle>
          <DialogDescription>
            Emergency mode will raise a critical alert for all crew and the NCPOR control room in Goa and switch the
            dashboard to the emergency checklist.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-3">
        <SheetHeader className="px-2">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export function TopBar() {
  const router = useRouter();
  const { demoMode } = useStation();
  const signOut = async () => {
    await getSupabase().auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-6">
        <MobileNav />
        <Logo />
        <div className="order-last flex w-full flex-wrap items-center gap-2">
          <Clocks />
          <SyncPill />
          <SimulatedBadge />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {demoMode && <DemoControls />}
          <StationSwitcher />
          <EmergencyButton />
          <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
