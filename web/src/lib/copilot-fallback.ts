// Answers built straight from the live station data, used when every Gemini model is unavailable.
// Keyword matching in English and Hindi; numbers come from the same request the AI would see.
import { STATIONS } from "@/shared/stations";
import type { CopilotRequest } from "@/shared/types";

type Lang = "en" | "hi";
type Topic = "fuel" | "generator" | "safety" | "alerts" | "inventory" | "water" | "summary";

const KEYWORDS: Record<Exclude<Topic, "summary">, string[]> = {
  fuel: ["fuel", "diesel", "runway", "resupply", "ship", "ईंधन", "डीज़ल", "डीजल", "जहाज़", "जहाज", "आपूर्ति"],
  generator: ["generator", "dg", "coolant", "vibration", "power", "load", "जनरेटर", "बिजली", "कूलेंट", "कंपन"],
  safety: ["safe", "safety", "weather", "wind", "outside", "trip", "blizzard", "temperature", "cold", "सुरक्षा", "मौसम", "हवा", "बाहर", "यात्रा", "बर्फ़ीला", "तापमान", "ठंड"],
  alerts: ["alert", "alarm", "warning", "problem", "issue", "अलर्ट", "चेतावनी", "समस्या"],
  inventory: ["stock", "inventory", "store", "food", "medicine", "spare", "item", "भंडार", "सामान", "भोजन", "दवा", "पुर्जे"],
  water: ["water", "lake", "पानी", "झील", "जल"],
};

function topicOf(question: string): Topic {
  const q = question.toLowerCase();
  for (const [topic, words] of Object.entries(KEYWORDS) as [Topic, string[]][]) {
    if (words.some((w) => q.includes(w))) return topic;
  }
  return "summary";
}

const n = (v: number) => Math.round(v).toLocaleString("en-US");

const HEALTH_HI: Record<string, string> = { ok: "ठीक", warning: "चेतावनी", critical: "गंभीर" };

function answer(topic: Topic, r: CopilotRequest, lang: Lang): string {
  const name = lang === "hi" ? (r.stationId === "maitri" ? "मैत्री" : "भारती") : STATIONS[r.stationId].name;
  const s = r.snapshot;
  const f = r.fuelRunway;
  const hot = s.energy.generators.find((g) => g.running && (g.coolantTempC >= 95 || g.vibrationMm >= 5));
  const open = r.recentAlerts.filter((a) => !a.acknowledged);
  const critical = open.filter((a) => a.severity === "critical");
  const hi = lang === "hi";

  switch (topic) {
    case "fuel":
      return hi
        ? `${name} में ${n(s.fuelLitres)} लीटर डीज़ल है, जो ${n(f.burnRateLpd)} लीटर/दिन की खपत पर लगभग ${n(f.daysLeft)} दिन चलेगा (${f.runoutDate} तक)। अगला जहाज़ ${f.resupplyDate} को है, इसलिए मार्जिन ${n(f.marginDays)} दिन है। सुझाव: ${f.marginDays < 30 ? "SOP 3 के अनुसार अभी से ईंधन बचत शुरू करें।" : "सामान्य खपत जारी रखें और साप्ताहिक समीक्षा करें।"}`
        : `${name} has ${n(s.fuelLitres)} L of diesel, about ${n(f.daysLeft)} days at ${n(f.burnRateLpd)} L/day (runs out ${f.runoutDate}). The next ship is due ${f.resupplyDate}, a margin of ${n(f.marginDays)} days. Recommendation: ${f.marginDays < 30 ? "start fuel conservation now (SOP 3)." : "keep normal consumption and review weekly."}`;
    case "generator": {
      const list = s.energy.generators
        .map((g) => (hi ? `${g.name.replace("Generator", "जनरेटर")}: ${g.running ? `${n(g.loadKw)} kW, कूलेंट ${g.coolantTempC} °C, कंपन ${g.vibrationMm} mm/s` : "स्टैंडबाय"}` : `${g.name}: ${g.running ? `${n(g.loadKw)} kW, coolant ${g.coolantTempC} °C, vibration ${g.vibrationMm} mm/s` : "standby"}`))
        .join("; ");
      const advice = hot
        ? hi ? `${hot.name.replace("Generator", "जनरेटर")} सीमा के पास है; SOP 2 के अनुसार भार स्टैंडबाय जनरेटर पर डालें और कूलिंग जाँचें।` : `${hot.name} is near its limits; shift load to the standby generator and inspect cooling (SOP 2).`
        : hi ? "सभी जनरेटर सामान्य सीमा में हैं।" : "All generators are within normal limits.";
      return hi
        ? `${name} का कुल भार ${n(s.energy.totalLoadKw)} kW है (डीज़ल ${n(s.energy.dieselKw)}, पवन ${n(s.energy.windKw)}, सौर ${n(s.energy.solarKw)} kW)। ${list}। ${advice}`
        : `${name} load is ${n(s.energy.totalLoadKw)} kW (diesel ${n(s.energy.dieselKw)}, wind ${n(s.energy.windKw)}, solar ${n(s.energy.solarKw)} kW). ${list}. ${advice}`;
    }
    case "safety": {
      const w = s.weather;
      const si = r.safetyIndex;
      return hi
        ? `${name} में तापमान ${n(w.tempC)} °C, हवा ${n(w.windKph)} km/h, विंड चिल ${n(w.windChillC)} °C और दृश्यता ${w.visibilityKm} km है। सुरक्षा सूचकांक ${si.score}/100 है। सुझाव: ${si.score >= 70 ? "बाहर जाना सुरक्षित है; SOP 1 के अनुसार कम से कम 2 लोग और चेक-आउट ज़रूरी है।" : si.score >= 40 ? "सावधानी: केवल ज़रूरी काम के लिए, छोटी यात्रा और रेडियो संपर्क के साथ।" : "बाहर न जाएँ; सभी फ़ील्ड यात्राएँ रोकें (SOP 4)।"}`
        : `${name}: ${n(w.tempC)} °C, wind ${n(w.windKph)} km/h, wind chill ${n(w.windChillC)} °C, visibility ${w.visibilityKm} km. Safety index ${si.score}/100 (${si.label}). Recommendation: ${si.score >= 70 ? "outdoor work is fine with at least 2 people and a check-out (SOP 1)." : si.score >= 40 ? "essential trips only, kept short, with radio contact." : "stay inside and stop all field trips (SOP 4)."}`;
    }
    case "alerts":
      if (open.length === 0) return hi ? `${name} में कोई खुला अलर्ट नहीं है। सभी प्रणालियाँ सामान्य हैं।` : `${name} has no open alerts. All systems are normal.`;
      return hi
        ? `${name} में ${open.length} खुले अलर्ट हैं (${critical.length} गंभीर)। सबसे ज़रूरी: "${(critical[0] ?? open[0]).title}"। सुझाव: पहले गंभीर अलर्ट पर कार्रवाई करें और उसे स्वीकार करें।`
        : `${name} has ${open.length} open alerts (${critical.length} critical). Most urgent: "${(critical[0] ?? open[0]).title}". Recommendation: act on the critical alert first, then acknowledge it.`;
    case "inventory":
      if (r.atRiskItems.length === 0) return hi ? `${name} में अगले जहाज़ (${f.resupplyDate}) तक कोई सामान कम पड़ने का खतरा नहीं है।` : `No ${name} stores are at risk before the next ship (${f.resupplyDate}).`;
      return hi
        ? `अगले जहाज़ से पहले ${r.atRiskItems.length} सामान कम पड़ सकते हैं: ${r.atRiskItems.slice(0, 4).map((i) => i.name).join(", ")}। सुझाव: खपत घटाएँ और दूसरे स्टेशन से अतिरिक्त माँगें।`
        : `${r.atRiskItems.length} items may run short before the ship: ${r.atRiskItems.slice(0, 4).map((i) => i.name).join(", ")}. Recommendation: reduce use and check the other station for spares.`;
    case "water":
      return hi
        ? `${name} में ${n(s.waterLitres)} लीटर पानी भंडार में है। सुझाव: ${s.waterLitres < 20_000 ? "SOP 10 के अनुसार पानी की बचत शुरू करें।" : "भंडार सामान्य है।"}`
        : `${name} has ${n(s.waterLitres)} L of water in storage. Recommendation: ${s.waterLitres < 20_000 ? "start water saving (SOP 10)." : "storage is at a normal level."}`;
    default:
      return hi
        ? `${name} की स्थिति: ${HEALTH_HI[s.overallHealth] ?? s.overallHealth}। ईंधन ${n(f.daysLeft)} दिन, भार ${n(s.energy.totalLoadKw)} kW, बाहर ${n(s.weather.tempC)} °C, सुरक्षा सूचकांक ${r.safetyIndex.score}/100, खुले अलर्ट ${open.length}। ईंधन, जनरेटर, मौसम, अलर्ट या भंडार के बारे में पूछें।`
        : `${name} status: ${s.overallHealth}. Fuel ${n(f.daysLeft)} days, load ${n(s.energy.totalLoadKw)} kW, outside ${n(s.weather.tempC)} °C, safety index ${r.safetyIndex.score}/100, ${open.length} open alerts. Ask me about fuel, generators, weather, alerts or stores.`;
  }
}

/** A short, data-grounded answer for when the AI service cannot be reached. */
export function fallbackAnswer(r: CopilotRequest, lang: Lang): string {
  const note = lang === "hi" ? "\n\n(AI सेवा अभी व्यस्त है; यह उत्तर सीधे स्टेशन डेटा से है।)" : "\n\n(The AI service is busy right now; this answer comes straight from the station data.)";
  return answer(topicOf(r.question), r, lang) + note;
}
