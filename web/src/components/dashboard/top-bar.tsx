"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getSupabase } from "@/lib/supabase";
import { STATION_IDS, STATIONS } from "@/shared/stations";
import { DemoControls } from "./demo-controls";
import { LanguageToggle, useT } from "@/components/language";
import { ThemeToggle } from "@/components/theme";
import { Logo } from "./logo";
import { useOps } from "./ops-context";
import { SidebarNav } from "./sidebar";
import { Clocks, SimulatedBadge, SyncPill } from "./status-bits";
import { useStation } from "./station-context";

function StationSwitcher() {
  const { stationId, setStation } = useStation();
  const t = useT();
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
          {t(STATIONS[id].name)}
        </button>
      ))}
    </div>
  );
}

function LowBandwidthSwitch() {
  const { lowBandwidth, setLowBandwidth } = useOps();
  const t = useT();
  return (
    <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <Switch size="sm" checked={lowBandwidth} onCheckedChange={(c) => setLowBandwidth(c)} aria-label="Low-bandwidth mode" />
      {t("Low bandwidth")}
    </label>
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
          <LowBandwidthSwitch />
          <LanguageToggle />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {demoMode && <DemoControls />}
          <StationSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => void signOut()} aria-label="Sign out">
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}
