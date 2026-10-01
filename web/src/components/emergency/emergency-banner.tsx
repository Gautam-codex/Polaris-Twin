"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/language";
import { useOps } from "@/components/dashboard/ops-context";
import { useNow } from "@/hooks/useNow";
import { createIncident } from "@/lib/data";
import { PLAYBOOKS } from "@/lib/playbooks";
import { STATIONS } from "@/shared/stations";

function elapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}

/** Banner with elapsed timer, checklist, NCPOR notification and end button while an emergency is active. */
export function EmergencyBanner() {
  const { emergency, updateEmergency, endEmergency, runOrQueue, linkDown } = useOps();
  const now = useNow(1000);
  const [notifying, setNotifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();
  if (!emergency) return null;

  const playbook = PLAYBOOKS[emergency.kind];
  const station = STATIONS[emergency.stationId];

  const toggle = (index: number) =>
    updateEmergency({
      done: emergency.done.includes(index) ? emergency.done.filter((i) => i !== index) : [...emergency.done, index],
    });

  const notify = async () => {
    setNotifying(true);
    setError(null);
    try {
      await runOrQueue("Emergency report to NCPOR Goa", () =>
        createIncident({
          stationId: emergency.stationId,
          title: `Emergency: ${playbook.label} at ${station.name}`,
          description: `Declared at ${new Date(emergency.startedAt).toISOString().slice(11, 16)} UTC. ${emergency.done.length} of ${playbook.steps.length} checklist steps complete.`,
          severity: "high",
          reportedBy: "Station leader",
        }),
      );
      updateEmergency({ notifiedAt: Date.now() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not notify NCPOR");
    } finally {
      setNotifying(false);
    }
  };

  return (
    <section className="mb-6 rounded-lg border border-destructive/40 bg-destructive/5" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-destructive/20 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
          </span>
          <p className="font-medium text-destructive">
            Emergency: {playbook.label} at {station.name}
          </p>
          <span className="font-mono text-sm text-destructive">{now ? elapsed(now - emergency.startedAt) : "--:--"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {emergency.notifiedAt ? (
            <span className="flex items-center gap-1 text-sm text-success">
              <Check className="size-4" />
              {linkDown ? "NCPOR report queued" : `NCPOR notified ${new Date(emergency.notifiedAt).toISOString().slice(11, 16)} UTC`}
            </span>
          ) : (
            <Button size="sm" variant="outline" disabled={notifying} onClick={() => void notify()}>
              <Send /> {t("Notify NCPOR Goa")}
            </Button>
          )}
          <Button size="sm" variant="destructive" className="bg-destructive text-white hover:bg-destructive/90" onClick={endEmergency}>
            {t("End emergency")}
          </Button>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="mb-3 text-xs text-muted-foreground">
          {playbook.sop} · {emergency.done.length} of {playbook.steps.length} steps done
        </p>
        <ol className="flex flex-col gap-1.5">
          {playbook.steps.map((step, i) => {
            const done = emergency.done.includes(i);
            return (
              <li key={step}>
                <label className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-destructive/5">
                  <input type="checkbox" checked={done} onChange={() => toggle(i)} className="mt-0.5 size-4 accent-[#B42318]" />
                  <span className={cn("text-foreground", done && "text-muted-foreground line-through")}>
                    {i + 1}. {step}
                  </span>
                </label>
              </li>
            );
          })}
        </ol>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}
