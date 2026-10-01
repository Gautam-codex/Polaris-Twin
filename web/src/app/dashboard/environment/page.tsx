"use client";

import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { Gauge } from "@/components/dashboard/gauge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { useStation } from "@/components/dashboard/station-context";
import { FieldTripPlanner } from "@/components/environment/field-trip";
import { ForecastChart, LiveWeather, StockCards } from "@/components/environment/weather-panels";
import { useOps } from "@/components/dashboard/ops-context";
import { useWeatherForecast } from "@/hooks/useWeatherForecast";
import { CHART } from "@/lib/health";
import { safetyIndex } from "@/shared/predictions";
import { getSnapshot } from "@/shared/simulator";
import type { StationId, WeatherForecastPoint } from "@/shared/types";

const HOUR = 3_600_000;

/** Simulated 48 h forecast, used until /api/weather responds. */
function simulatedForecast(stationId: StationId, hour: number): WeatherForecastPoint[] {
  return Array.from({ length: 48 }, (_, h) => {
    const t = hour + h * HOUR;
    const w = getSnapshot(stationId, t).weather;
    return { time: new Date(t).toISOString(), tempC: w.tempC, windKph: w.windKph };
  });
}

export default function EnvironmentPage() {
  const { stationId, station, snapshot } = useStation();
  const api = useWeatherForecast(stationId);
  const hour = snapshot ? Math.floor(snapshot.timestamp / HOUR) * HOUR : null;
  const fallback = useMemo(() => (hour === null ? [] : simulatedForecast(stationId, hour)), [stationId, hour]);
  const { lowBandwidth } = useOps();
  const fullForecast = api?.forecast ?? fallback;
  // Low bandwidth: every third hour is enough for the chart; the planner still uses every hour.
  const chartForecast = lowBandwidth ? fullForecast.filter((_, i) => i % 3 === 0) : fullForecast;
  const forecastSource = api?.source ?? "simulated";

  if (!snapshot) {
    return (
      <>
        <PageHeader title="Environment" description="Weather, outdoor safety and field-trip planning." />
        <p className="text-sm text-muted-foreground">Connecting to station feed…</p>
      </>
    );
  }

  const safety = safetyIndex(snapshot.weather);
  const safetyColor = safety.label === "Safe" ? CHART.success : safety.label === "Caution" ? CHART.warning : CHART.danger;

  return (
    <>
      <PageHeader
        title="Environment"
        description={`${station.name} (${station.lat.toFixed(2)}°, ${station.lon.toFixed(2)}°): weather, outdoor safety and field-trip planning.`}
      />
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-3">
          <LiveWeather weather={snapshot.weather} />
          <Panel title="Field safety index" icon={ShieldCheck} className="xl:col-span-2">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <Gauge value={safety.score} color={safetyColor} label={String(safety.score)} sublabel={safety.label} size={220} />
              <ul className="flex flex-1 flex-col gap-2 text-sm">
                {safety.reasons.map((r) => (
                  <li key={r} className="rounded-md border border-border px-3 py-2 text-muted-foreground">
                    {r}
                  </li>
                ))}
                <li className="text-xs text-muted-foreground">
                  Score starts at 100 and drops for wind over 40 km/h, wind chill below −30 °C and visibility under 1 km.
                </li>
              </ul>
            </div>
          </Panel>
        </div>
        <ForecastChart forecast={chartForecast} source={forecastSource} />
        <div className="grid gap-4 xl:grid-cols-2">
          <FieldTripPlanner stationId={stationId} forecast={fullForecast} now={hour ?? snapshot.timestamp} />
          <StockCards snapshot={snapshot} station={station} />
        </div>
      </div>
    </>
  );
}
