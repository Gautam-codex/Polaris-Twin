"use client";

import { Info } from "lucide-react";
import { DaylightCard, WellbeingChart } from "@/components/crew/crew-panels";
import { PageHeader } from "@/components/dashboard/page-header";
import { useStation } from "@/components/dashboard/station-context";
import { MIN_RESPONSES, useWellbeing } from "@/hooks/useWellbeing";

export default function CrewPage() {
  const { stationId, station, snapshot } = useStation();
  const now = snapshot?.timestamp ?? null;
  const { rolling, recentMood, loading, error } = useWellbeing(stationId, now);
  const low = recentMood?.mood !== null && recentMood?.mood !== undefined && recentMood.mood < 3;

  return (
    <>
      <PageHeader
        title="Crew"
        description={`${station.name}: anonymous wellbeing trends and daylight. Individual check-ins are never shown.`}
      />
      {low && (
        <div className="mb-4 flex gap-3 rounded-lg border border-warning/30 bg-warning/10 px-5 py-4 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            Average mood over the last 3 days is <span className="font-medium">{recentMood?.mood} / 5</span>. A short team
            check-in, a shared meal or a change in rota can help. The station doctor is available for anyone who wants to talk.
          </p>
        </div>
      )}
      {recentMood && recentMood.mood === null && !loading && (
        <p className="mb-4 text-sm text-muted-foreground">
          Fewer than {MIN_RESPONSES} check-ins in the last 3 days, so no recent mood average is shown.
        </p>
      )}
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {loading ? <p className="text-sm text-muted-foreground">Loading wellbeing trends…</p> : <WellbeingChart points={rolling} />}
        </div>
        {now !== null && <DaylightCard station={station} now={now} />}
      </div>
    </>
  );
}
