import { visibilityFor, windChill } from "@/shared/environment";
import { round } from "@/shared/random";
import { getSnapshot } from "@/shared/simulator";
import { STATIONS } from "@/shared/stations";
import type { StationId, WeatherForecastPoint, WeatherResponse } from "@/shared/types";

const REVALIDATE_S = 600;
const HOUR = 3_600_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface OpenMeteo {
  current: { temperature_2m: number; wind_speed_10m: number; visibility: number | null; snow_depth: number | null };
  hourly: { time: string[]; temperature_2m: number[]; wind_speed_10m: number[] };
}

function json(body: WeatherResponse, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { ...CORS, "Cache-Control": `public, s-maxage=${REVALIDATE_S}, stale-while-revalidate=60` },
  });
}

/** Simulated weather and a 48 h simulated forecast, used when Open-Meteo is unreachable. */
function simulated(stationId: StationId): WeatherResponse {
  const now = Date.now();
  const forecast: WeatherForecastPoint[] = Array.from({ length: 48 }, (_, h) => {
    const t = Math.floor(now / HOUR) * HOUR + h * HOUR;
    const w = getSnapshot(stationId, t).weather;
    return { time: new Date(t).toISOString(), tempC: w.tempC, windKph: w.windKph };
  });
  return { ...getSnapshot(stationId, now).weather, stationId, forecast };
}

async function live(stationId: StationId): Promise<WeatherResponse> {
  const { lat, lon } = STATIONS[stationId];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,wind_speed_10m,visibility,snow_depth" +
    "&hourly=temperature_2m,wind_speed_10m&forecast_hours=48&wind_speed_unit=kmh&timezone=UTC";
  const res = await fetch(url, { next: { revalidate: REVALIDATE_S } });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const data = (await res.json()) as OpenMeteo;
  const { temperature_2m: tempC, wind_speed_10m: windKph, visibility, snow_depth } = data.current;
  if (typeof tempC !== "number" || typeof windKph !== "number") throw new Error("Open-Meteo returned no current data");

  // Grid snow depth over the ice sheet can read tens of metres (it is ice, not snow cover),
  // so only trust values under 3 m and fall back to the simulated depth otherwise.
  const simulatedSnow = getSnapshot(stationId, Date.now()).weather.snowCm;
  const snowCm = snow_depth !== null && snow_depth < 3 ? round(snow_depth * 100) : simulatedSnow;
  const visibilityKm = visibility !== null ? round(Math.min(visibility / 1000, 50), 2) : round(visibilityFor(windKph), 2);

  const forecast = data.hourly.time.map((time, i) => ({
    time: `${time}:00Z`,
    tempC: data.hourly.temperature_2m[i],
    windKph: data.hourly.wind_speed_10m[i],
  }));

  return {
    stationId,
    tempC,
    windKph,
    windChillC: round(windChill(tempC, windKph)),
    visibilityKm,
    snowCm,
    source: "open-meteo",
    forecast,
  };
}

export async function GET(request: Request): Promise<Response> {
  const station = new URL(request.url).searchParams.get("station");
  if (station !== "maitri" && station !== "bharati") {
    return Response.json({ error: "station must be maitri or bharati" }, { status: 400, headers: CORS });
  }
  try {
    return json(await live(station));
  } catch {
    return json(simulated(station));
  }
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}
