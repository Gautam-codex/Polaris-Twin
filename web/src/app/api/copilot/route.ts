import { GoogleGenerativeAI } from "@google/generative-ai";
import { SOPS } from "@/lib/sops";
import { STATIONS } from "@/shared/stations";
import type { CopilotRequest, CopilotResponse, StationSnapshot } from "@/shared/types";

// gemini-2.0-flash has been retired; GEMINI_MODEL overrides the first choice.
const MODELS = [process.env.GEMINI_MODEL, "gemini-3.5-flash", "gemini-flash-latest"].filter(
  (m): m is string => typeof m === "string" && m.length > 0,
);
const TIMEOUT_MS = 20_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function reply(body: CopilotResponse, status = 200): Response {
  return Response.json(body, { status, headers: CORS });
}

/** Only the fields the copilot needs, to keep the prompt small. */
function compactSnapshot(s: StationSnapshot) {
  return {
    time: new Date(s.timestamp).toISOString(),
    overallHealth: s.overallHealth,
    weather: s.weather,
    fuelLitres: s.fuelLitres,
    waterLitres: s.waterLitres,
    energy: {
      totalLoadKw: s.energy.totalLoadKw,
      dieselKw: s.energy.dieselKw,
      windKw: s.energy.windKw,
      solarKw: s.energy.solarKw,
      batteryPct: s.energy.batteryPct,
      heatingDemandKw: s.energy.heatingDemandKw,
      generators: s.energy.generators,
    },
    buildings: s.buildings.map((b) => ({ name: b.name, type: b.type, health: b.health })),
  };
}

function systemPrompt(req: CopilotRequest): string {
  const station = STATIONS[req.stationId];
  const data = {
    station: { name: station.name, region: station.region, lat: station.lat, lon: station.lon },
    snapshot: compactSnapshot(req.snapshot),
    fuelRunway: req.fuelRunway,
    fuelScenarios: req.fuelScenarios ?? [],
    safetyIndex: req.safetyIndex,
    atRiskItems: req.atRiskItems.map((i) => ({ name: i.name, category: i.category, quantity: i.quantity, unit: i.unit, dailyUse: i.dailyUse, minLevel: i.minLevel })),
    recentAlerts: req.recentAlerts.slice(0, 10).map((a) => ({ severity: a.severity, title: a.title, message: a.message, at: a.createdAt, acknowledged: a.acknowledged })),
  };
  return [
    `You are "Polaris", the operations copilot for India's ${station.name} Antarctic research station, helping the NCPOR control room in Goa and the station crew.`,
    "Rules:",
    "- Answer in 2-5 short sentences. Cite the specific numbers you used, with units.",
    "- End with one clear recommendation.",
    `- If the data below does not contain what is needed, say "I don't have that data" instead of guessing.`,
    "- The data comes from a simulated sensor feed for a hackathon demo, not real NCPOR data. Mention this only if asked where the data comes from.",
    "- Follow the SOPs below when recommending actions, and name the SOP section you used.",
    req.language === "hi"
      ? "- Answer in Hindi (Devanagari script). Keep numbers and units in digits."
      : "- Answer in English.",
    "",
    "Station data (JSON):",
    JSON.stringify(data),
    "",
    "Station SOPs:",
    SOPS,
  ].join("\n");
}

function isValid(body: unknown): body is CopilotRequest {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Partial<CopilotRequest>;
  return (
    (b.stationId === "maitri" || b.stationId === "bharati") &&
    typeof b.question === "string" &&
    b.question.trim().length > 0 &&
    b.question.length <= 1000 &&
    typeof b.snapshot === "object" &&
    typeof b.fuelRunway === "object" &&
    typeof b.safetyIndex === "object" &&
    Array.isArray(b.atRiskItems) &&
    Array.isArray(b.recentAlerts) &&
    (b.language === "en" || b.language === "hi")
  );
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return reply({ answer: "", error: "The copilot is not configured yet (GEMINI_API_KEY is missing)." }, 503);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ answer: "", error: "Invalid request." }, 400);
  }
  if (!isValid(body)) return reply({ answer: "", error: "Invalid request: missing station data or question." }, 400);

  const genAI = new GoogleGenerativeAI(apiKey);
  const contents = [
    ...(body.history ?? []).slice(-6).map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.text }] })),
    { role: "user", parts: [{ text: body.question.trim() }] },
  ];

  // One 20 s budget shared across the primary model and its fallback.
  const deadline = Date.now() + TIMEOUT_MS;
  for (const modelName of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < 3_000) break;
    try {
      const model = genAI.getGenerativeModel(
        { model: modelName, systemInstruction: systemPrompt(body), generationConfig: { temperature: 0.3, maxOutputTokens: 4096 } },
        { timeout: remaining },
      );
      const result = await model.generateContent({ contents });
      const answer = result.response.text().trim();
      const finish = result.response.candidates?.[0]?.finishReason;
      if (finish && finish !== "STOP") console.warn(`copilot: ${modelName} finished with ${finish}`);
      if (answer) return reply({ answer, model: modelName });
    } catch (e) {
      console.error(`copilot: ${modelName} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return reply(
    { answer: "", error: "Polaris couldn't reach the AI service just now. Please try again in a moment." },
    502,
  );
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}
