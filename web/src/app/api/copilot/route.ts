import { fallbackAnswer } from "@/lib/copilot-fallback";
import { SOPS } from "@/lib/sops";
import { STATIONS } from "@/shared/stations";
import type { CopilotRequest, CopilotResponse, StationSnapshot } from "@/shared/types";

export const maxDuration = 30;

/**
 * Tried in order, each with its own time limit, so one slow or overloaded model
 * cannot use up the whole budget. GEMINI_MODEL (optional) is tried first.
 * `noThinking` turns off the slow "thinking" step on models that support it.
 */
const MODELS: { name: string; timeoutMs: number; noThinking?: boolean }[] = [
  ...(process.env.GEMINI_MODEL ? [{ name: process.env.GEMINI_MODEL, timeoutMs: 9_000 }] : []),
  { name: "gemini-flash-latest", timeoutMs: 9_000, noThinking: true },
  { name: "gemini-3.5-flash-lite", timeoutMs: 6_000 },
  { name: "gemini-flash-lite-latest", timeoutMs: 6_000 },
  { name: "gemini-3.8-flash", timeoutMs: 8_000 },
];
const BUDGET_MS = 25_000;
const API = "https://generativelanguage.googleapis.com/v1beta/models";

/** Hindi when asked in Devanagari, whatever the language switch says. */
function answerLanguage(req: CopilotRequest): "en" | "hi" {
  return /[ऀ-ॿ]/.test(req.question) ? "hi" : req.language;
}

interface GeminiReply {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  error?: { message?: string };
}

async function callGemini(
  model: (typeof MODELS)[number],
  apiKey: string,
  system: string,
  contents: { role: string; parts: { text: string }[] }[],
  timeoutMs: number,
): Promise<string> {
  const res = await fetch(`${API}/${model.name}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        ...(model.noThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = (await res.json()) as GeminiReply;
  if (!res.ok) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

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

function systemPrompt(req: CopilotRequest, language: "en" | "hi"): string {
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
    language === "hi"
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ answer: "", error: "Invalid request." }, 400);
  }
  if (!isValid(body)) return reply({ answer: "", error: "Invalid request: missing station data or question." }, 400);

  const language = answerLanguage(body);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return reply({ answer: fallbackAnswer(body, language), model: "station-data" });
  const system = systemPrompt(body, language);
  const contents = [
    ...(body.history ?? []).slice(-6).map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.text }] })),
    { role: "user", parts: [{ text: body.question.trim() }] },
  ];

  const deadline = Date.now() + BUDGET_MS;
  for (const model of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < 2_500) break;
    try {
      const answer = await callGemini(model, apiKey, system, contents, Math.min(model.timeoutMs, remaining));
      if (answer) return reply({ answer, model: model.name });
    } catch (e) {
      console.error(`copilot: ${model.name} failed:`, e instanceof Error ? e.message : e);
    }
  }
  // Every model was slow or overloaded: answer from the station data instead of failing.
  return reply({ answer: fallbackAnswer(body, language), model: "station-data" });
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS });
}
