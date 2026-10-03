// English → Hindi for tab names, headings and buttons. Everything else goes through the shared dictionary.

import { toHindi } from "@shared/i18n";

export type Language = "en" | "hi";

const HINDI: Record<string, string> = {
  // Tabs and screens
  Home: "होम",
  Alerts: "अलर्ट",
  Safety: "सुरक्षा",
  Inventory: "भंडार",
  More: "अधिक",
  "Scan item": "आइटम स्कैन करें",
  "Wellbeing check-in": "स्वास्थ्य जाँच",
  "Ask Polaris": "पोलारिस से पूछें",
  Settings: "सेटिंग्स",
  "Emergency SOS": "आपातकालीन SOS",

  // Card titles
  "Station health": "स्टेशन की स्थिति",
  "Fuel runway": "ईंधन अवधि",
  "Power load": "बिजली भार",
  Outside: "बाहर",
  "Safety index": "सुरक्षा सूचकांक",
  "Next resupply (ISEA ship)": "अगली आपूर्ति (ISEA जहाज़)",
  "Latest alerts": "नवीनतम अलर्ट",
  "Field safety index": "फ़ील्ड सुरक्षा सूचकांक",
  "Next 12 hours": "अगले 12 घंटे",
  "Going outside": "बाहर जाना",
  "Field team out": "फ़ील्ड टीम बाहर",
  Sync: "सिंक",
  Station: "स्टेशन",
  Account: "खाता",
  Language: "भाषा",
  Appearance: "रूप",
  System: "सिस्टम",
  Light: "हल्का",
  Dark: "गहरा",
  "How are you today?": "आज आप कैसा महसूस कर रहे हैं?",
  "Team mood · last 7 days": "टीम का मूड · पिछले 7 दिन",
  "Choose the emergency": "आपातकाल चुनें",
  Checklist: "चेकलिस्ट",

  // Buttons and chips
  Acknowledge: "स्वीकार करें",
  "All alerts": "सभी अलर्ट",
  Scan: "स्कैन",
  "Check out": "चेक आउट",
  "Team is back inside": "टीम वापस अंदर है",
  "Sign in": "साइन इन",
  "Sign out": "साइन आउट",
  "Use demo account": "डेमो खाता उपयोग करें",
  "Allow camera": "कैमरा अनुमति दें",
  "Submit check-in": "जाँच जमा करें",
  Send: "भेजें",
  "Send SOS": "SOS भेजें",
  Close: "बंद करें",
  Open: "खुले",
  All: "सभी",
  Critical: "गंभीर",
  Warning: "चेतावनी",
  "Hold for SOS": "SOS के लिए दबाकर रखें",
  Fire: "आग",
  "Medical evacuation": "चिकित्सा निकासी",
  "Power failure": "बिजली विफलता",
  "Person missing": "व्यक्ति लापता",
  English: "अंग्रेज़ी",
  "हिंदी": "हिंदी",
};

/** Translate English UI text; falls back to the shared dictionary, then to the English text. */
export function translate(text: string, language: Language): string {
  if (language !== "hi") return text;
  return HINDI[text] ?? toHindi(text);
}
