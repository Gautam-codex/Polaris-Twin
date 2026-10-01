// English → Hindi for navigation, headings, card titles and buttons.
// Keys are the English text; {name} placeholders are filled by t(text, vars).

export type Language = "en" | "hi";

type Pair = { en: string; hi: string };

const PAIRS: Pair[] = [
  // Navigation and shell
  { en: "Overview", hi: "अवलोकन" },
  { en: "Digital Twin", hi: "डिजिटल ट्विन" },
  { en: "Energy", hi: "ऊर्जा" },
  { en: "Logistics", hi: "रसद" },
  { en: "Environment", hi: "पर्यावरण" },
  { en: "Replay", hi: "रीप्ले" },
  { en: "Compliance", hi: "अनुपालन" },
  { en: "Crew", hi: "दल" },
  { en: "Compare", hi: "तुलना" },
  { en: "Modules", hi: "मॉड्यूल" },
  { en: "Maitri", hi: "मैत्री" },
  { en: "Bharati", hi: "भारती" },
  { en: "Emergency", hi: "आपातकाल" },
  { en: "Emergency active", hi: "आपातकाल सक्रिय" },
  { en: "Low bandwidth", hi: "कम बैंडविड्थ" },
  { en: "Demo", hi: "डेमो" },
  { en: "Ask Polaris", hi: "पोलारिस से पूछें" },
  { en: "Sign in", hi: "साइन इन" },
  { en: "Sign out", hi: "साइन आउट" },
  { en: "Simulated sensor feed", hi: "सिम्युलेटेड सेंसर फ़ीड" },

  // Page headings
  { en: "{station} control room", hi: "{station} नियंत्रण कक्ष" },
  { en: "Environmental compliance", hi: "पर्यावरण अनुपालन" },
  { en: "Compare stations", hi: "स्टेशनों की तुलना" },
  { en: "Control room sign-in", hi: "नियंत्रण कक्ष साइन-इन" },

  // Card titles
  { en: "Overall health", hi: "समग्र स्थिति" },
  { en: "Fuel runway", hi: "ईंधन अवधि" },
  { en: "Power load", hi: "बिजली भार" },
  { en: "Field safety index", hi: "फ़ील्ड सुरक्षा सूचकांक" },
  { en: "3D twin", hi: "3D ट्विन" },
  { en: "Site plan (2D)", hi: "साइट योजना (2D)" },
  { en: "Alerts", hi: "अलर्ट" },
  { en: "Outside temperature", hi: "बाहरी तापमान" },
  { en: "Station load", hi: "स्टेशन भार" },
  { en: "Diesel stock", hi: "डीज़ल भंडार" },
  { en: "At risk before resupply", hi: "आपूर्ति से पहले जोखिम में" },
  { en: "Next resupply (ISEA ship)", hi: "अगली आपूर्ति (ISEA जहाज़)" },
  { en: "Generator 1", hi: "जनरेटर 1" },
  { en: "Generator 2", hi: "जनरेटर 2" },
  { en: "Generator 3", hi: "जनरेटर 3" },
  { en: "Predictive maintenance", hi: "पूर्वानुमानित रखरखाव" },
  { en: "Battery bank", hi: "बैटरी बैंक" },
  { en: "Power supply mix · last 24 h", hi: "बिजली आपूर्ति मिश्रण · पिछले 24 घंटे" },
  { en: "Heating demand vs outside temperature · last 24 h", hi: "हीटिंग मांग बनाम बाहरी तापमान · पिछले 24 घंटे" },
  { en: "Days to survival", hi: "सुरक्षित रहने के दिन" },
  { en: "Fuel projection", hi: "ईंधन अनुमान" },
  { en: "Inventory", hi: "भंडार सूची" },
  { en: "Current weather", hi: "वर्तमान मौसम" },
  { en: "48 h forecast", hi: "48 घंटे का पूर्वानुमान" },
  { en: "Plan a field trip", hi: "फ़ील्ड यात्रा की योजना" },
  { en: "Snow depth", hi: "बर्फ़ की गहराई" },
  { en: "Water stock", hi: "जल भंडार" },
  { en: "Station at this moment", hi: "इस समय स्टेशन" },
  { en: "Alerts active at this time", hi: "इस समय सक्रिय अलर्ट" },
  { en: "CO₂ emitted", hi: "CO₂ उत्सर्जन" },
  { en: "Diesel burned", hi: "डीज़ल खपत" },
  { en: "Waste logged", hi: "दर्ज कचरा" },
  { en: "Spills", hi: "रिसाव" },
  { en: "CO₂ by month (estimated from diesel use)", hi: "मासिक CO₂ (डीज़ल उपयोग से अनुमानित)" },
  { en: "Log waste or a spill", hi: "कचरा या रिसाव दर्ज करें" },
  { en: "Compliance register", hi: "अनुपालन रजिस्टर" },
  { en: "Crew wellbeing · last 14 days", hi: "दल का स्वास्थ्य · पिछले 14 दिन" },
  { en: "Daylight at {station}", hi: "{station} में दिन का प्रकाश" },
  { en: "Side by side", hi: "आमने-सामने" },
  { en: "Stations and control room", hi: "स्टेशन और नियंत्रण कक्ष" },

  // Buttons
  { en: "Acknowledge", hi: "स्वीकार करें" },
  { en: "Open twin", hi: "ट्विन खोलें" },
  { en: "Reset view", hi: "दृश्य रीसेट करें" },
  { en: "Simulate fault on Generator 1", hi: "जनरेटर 1 में खराबी सिम्युलेट करें" },
  { en: "Clear demo fault", hi: "डेमो खराबी हटाएँ" },
  { en: "Export report", hi: "रिपोर्ट निर्यात करें" },
  { en: "Add to register", hi: "रजिस्टर में जोड़ें" },
  { en: "Play", hi: "चलाएँ" },
  { en: "Pause", hi: "रोकें" },
  { en: "Notify NCPOR Goa", hi: "NCPOR गोवा को सूचित करें" },
  { en: "End emergency", hi: "आपातकाल समाप्त करें" },
  { en: "Confirm emergency", hi: "आपातकाल की पुष्टि करें" },
  { en: "Cancel", hi: "रद्द करें" },
  { en: "Use demo account", hi: "डेमो खाता उपयोग करें" },
  { en: "Open live dashboard", hi: "लाइव डैशबोर्ड खोलें" },
  { en: "Download Android app", hi: "Android ऐप डाउनलोड करें" },
  { en: "Android app coming soon", hi: "Android ऐप जल्द आ रहा है" },

  // Landing page
  { en: "A digital twin for India's Antarctic stations", hi: "भारत के अंटार्कटिक स्टेशनों के लिए डिजिटल ट्विन" },
  { en: "The problem", hi: "समस्या" },
  { en: "What it does", hi: "यह क्या करता है" },
  { en: "How it works", hi: "यह कैसे काम करता है" },
  { en: "Built by", hi: "निर्माता" },
];

const HINDI = new Map(PAIRS.map((p) => [p.en, p.hi]));

/** Translate English UI text; unknown text is returned unchanged. */
export function translate(text: string, language: Language, vars?: Record<string, string | number>): string {
  const base = language === "hi" ? (HINDI.get(text) ?? text) : text;
  if (!vars) return base;
  return base.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}
