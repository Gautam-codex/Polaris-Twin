// English → Hindi for any UI text, including text with live numbers.
// Numbers, dates, times and station names are masked as {0}, {1}… so one dictionary
// entry ("{0} days") covers every value ("117 days" → "117 दिन").
import { HINDI } from "./i18n-hindi";

const NAMES: Record<string, string> = { Maitri: "मैत्री", Bharati: "भारती" };
const TOKEN = /[-−]?\d(?:[\d,.:/-]*\d)?|\b(?:Maitri|Bharati)\b/g;
const HAS_LETTERS = /[A-Za-z]/;

/** "Maitri burns 1,170 L/day" → { key: "{0} burns {1} L/day", values: ["Maitri", "1,170"] } */
export function maskText(text: string): { key: string; values: string[] } {
  const values: string[] = [];
  const key = text.replace(TOKEN, (m) => `{${values.push(m) - 1}}`);
  return { key, values };
}

function fill(template: string, values: string[]): string {
  return template.replace(/\{(\d+)\}/g, (_, i: string) => {
    const v = values[Number(i)] ?? "";
    return NAMES[v] ?? v;
  });
}

function lookup(core: string): string | null {
  const { key, values } = maskText(core);
  const hit = HINDI[key];
  return hit === undefined ? null : fill(hit, values);
}

function translateCore(core: string, depth = 0): string | null {
  if (NAMES[core]) return NAMES[core];
  const direct = lookup(core);
  if (direct !== null) return direct;
  if (depth > 2) return null;
  // Compound labels: translate each part ("… UTC · Blizzard conditions", "Power House: ok").
  for (const sep of [" · ", ": ", " — ", " / ", ", "]) {
    if (!core.includes(sep)) continue;
    const parts = core.split(sep);
    const out = parts.map((p) => (HAS_LETTERS.test(p) ? translateCore(p.trim(), depth + 1) ?? p : p));
    if (out.some((p, i) => p !== parts[i])) return out.join(sep);
  }
  return null;
}

/** Hindi for a piece of UI text, or the text unchanged when there is no translation. */
export function toHindi(text: string): string {
  if (!HAS_LETTERS.test(text)) return text;
  const lead = text.match(/^\s*/)?.[0] ?? "";
  const trail = text.match(/\s*$/)?.[0] ?? "";
  const core = text.trim().replace(/\s+/g, " ");
  const result = translateCore(core);
  return result === null ? text : lead + result + trail;
}
