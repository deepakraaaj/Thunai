// =============================================================================
// copy.ts — UI microcopy per language. Only chrome/labels live here; all
// in-the-moment scripts are generated live by the AI, never from this file.
// -----------------------------------------------------------------------------
// Pure-script languages (ta, hi) get their own strings. Romanized mixes
// (tanglish, hinglish) fall back to English chrome — short Latin labels read
// naturally inside a Tanglish/Hinglish experience — unless a distinct entry is
// provided. This keeps the table small while covering all five languages.
// =============================================================================

import type { Language } from "./types";

type Key =
  | "greeting"
  | "daysLabel"
  | "towardLabel"
  | "checkIn"
  | "iSlipped"
  | "cravingHit"
  | "you"
  | "caregiver"
  | "holdToTalk"
  | "imOkay"
  | "generatedLive"
  | "offlineBadge"
  | "pressCircle";

// Each entry supplies at least en; ta/hi optional; romanized mixes default to en.
type Entry = { en: string; ta?: string; hi?: string };

const STR: Record<Key, Entry> = {
  greeting: { en: "Hello", ta: "வணக்கம்", hi: "नमस्ते" },
  daysLabel: { en: "days", ta: "நாட்கள்", hi: "दिन" },
  towardLabel: { en: "toward", ta: "நோக்கி", hi: "के लिए" },
  checkIn: { en: "Check in", ta: "செக்-இன்", hi: "चेक-इन" },
  iSlipped: { en: "I slipped", ta: "நான் தவறிட்டேன்", hi: "मैं फिसल गया" },
  cravingHit: { en: "Craving hit?", ta: "ஆசை வந்துச்சா?", hi: "तलब लगी?" },
  you: { en: "You", ta: "நீங்க", hi: "आप" },
  caregiver: { en: "Caregiver", ta: "பராமரிப்பாளர்", hi: "देखभाल करने वाला" },
  holdToTalk: {
    en: "Hold to talk to me",
    ta: "பேச பிடிச்சு வையுங்க",
    hi: "बात करने के लिए दबाए रखें",
  },
  imOkay: { en: "I'm okay now", ta: "நான் இப்போ சரி", hi: "मैं अब ठीक हूँ" },
  generatedLive: {
    en: "Generated live",
    ta: "நேரலையில் உருவாக்கப்பட்டது",
    hi: "लाइव तैयार किया गया",
  },
  offlineBadge: {
    en: "Offline safety script — pre-written",
    ta: "ஆஃப்லைன் பாதுகாப்பு உரை — முன்பே எழுதப்பட்டது",
    hi: "ऑफ़लाइन सुरक्षा संदेश — पहले से लिखा हुआ",
  },
  pressCircle: {
    en: "When it gets heavy, press the circle",
    ta: "கஷ்டமா இருக்கும்போது, வட்டத்தை அழுத்துங்க",
    hi: "जब भारी लगे, तो घेरे को दबाएँ",
  },
};

export function t(key: Key, lang: Language): string {
  const e = STR[key];
  switch (lang) {
    case "ta":
      return e.ta ?? e.en;
    case "hi":
      return e.hi ?? e.en;
    // Romanized mixes and English use the Latin (English) chrome.
    case "tanglish":
    case "hinglish":
    case "en":
    default:
      return e.en;
  }
}
