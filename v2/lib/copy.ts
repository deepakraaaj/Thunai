// =============================================================================
// copy.ts — UI microcopy per language. Only chrome/labels live here; all
// in-the-moment scripts are generated live by the AI, never from this file.
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

const STR: Record<Key, Record<Language, string>> = {
  greeting: { ta: "வணக்கம்", en: "Hello", mix: "வணக்கம்" },
  daysLabel: { ta: "நாட்கள்", en: "days", mix: "days" },
  towardLabel: { ta: "நோக்கி", en: "toward", mix: "toward" },
  checkIn: { ta: "செக்-இன்", en: "Check in", mix: "Check in" },
  iSlipped: { ta: "நான் தவறிட்டேன்", en: "I slipped", mix: "I slipped" },
  cravingHit: { ta: "ஆசை வந்துச்சா?", en: "Craving hit?", mix: "Craving hit?" },
  you: { ta: "நீங்க", en: "You", mix: "You" },
  caregiver: { ta: "பராமரிப்பாளர்", en: "Caregiver", mix: "Caregiver" },
  holdToTalk: { ta: "பேச பிடிச்சு வையுங்க", en: "Hold to talk to me", mix: "Hold to talk to me" },
  imOkay: { ta: "நான் இப்போ சரி", en: "I'm okay now", mix: "I'm okay now" },
  generatedLive: { ta: "நேரலையில் உருவாக்கப்பட்டது", en: "Generated live", mix: "Generated live" },
  offlineBadge: {
    ta: "ஆஃப்லைன் பாதுகாப்பு உரை — முன்பே எழுதப்பட்டது",
    en: "Offline safety script — pre-written",
    mix: "Offline safety script — pre-written",
  },
  pressCircle: {
    ta: "கஷ்டமா இருக்கும்போது, வட்டத்தை அழுத்துங்க",
    en: "When it gets heavy, press the circle",
    mix: "When it gets heavy, press the circle",
  },
};

export function t(key: Key, lang: Language): string {
  return STR[key][lang];
}
