"use client";

import { useState } from "react";
import { CloudSnow, FlaskConical, RotateCcw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { useOps } from "./ops-context";
import { useStation } from "./station-context";

/** Presenter-only controls, shown when the URL has ?demo=1. */
export function DemoControls() {
  const { demo, linkDown, setLinkDown } = useOps();
  const { station, stationId } = useStation();
  const [note, setNote] = useState<string | null>(null);

  const act = (message: string, fn: () => void) => {
    fn();
    setNote(message);
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <FlaskConical /> Demo
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Demo controls</PopoverTitle>
          <PopoverDescription>Scripted events for presenting. They only affect this browser&apos;s simulated feed.</PopoverDescription>
        </PopoverHeader>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            variant="outline"
            className="justify-start"
            disabled={demo.faultPending}
            onClick={() => act("Generator 1 at Maitri is degrading. A critical alert will be raised in 30 s.", demo.injectFault)}
          >
            <FlaskConical /> {demo.faultPending ? "Fault running… alert in 30 s" : "Inject generator fault (Maitri G1)"}
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => act(`Blizzard at ${station.name} for 3 minutes: wind 85 km/h, visibility 0.2 km.`, () => demo.triggerBlizzard(stationId))}
          >
            <CloudSnow /> Trigger blizzard ({station.name})
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() =>
              act(linkDown ? "Satellite link restored; queued changes are syncing." : "Satellite link down. The station keeps running and queues changes.", () =>
                setLinkDown(!linkDown),
              )
            }
          >
            <WifiOff /> {linkDown ? "Restore satellite link" : "Simulate link outage"}
          </Button>
          <Button variant="ghost" className="justify-start" onClick={() => act("All demo events cleared.", demo.clearAll)}>
            <RotateCcw /> Clear all
          </Button>
        </div>
        {note && <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">{note}</p>}
      </PopoverContent>
    </Popover>
  );
}
