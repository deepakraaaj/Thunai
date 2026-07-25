// =============================================================================
// offline.ts — Honestly-labeled, pre-written safety scripts.
// These are shown ONLY when every live provider fails, and the UI badges them
// "Offline safety script — pre-written". They are never presented as live AI.
// =============================================================================

import type { Language } from "./types";

type Surface = "sos" | "caregiver" | "checkin" | "slip" | "swap" | "okay" | "onboarding";

const SCRIPTS: Record<Surface, Record<Language, string>> = {
  sos: {
    ta: "நீங்க இப்போ ரொம்ப கஷ்டமான ஒரு நிமிஷத்துல இருக்கீங்க — அது கடந்துபோகும். மெதுவா ஒரு நீண்ட மூச்சு விடுங்க… உள்ளே… வெளியே. இந்த ஆசை ஒரு அலை மாதிரி, உயரும், பிறகு தானா தணியும். ஒரு டம்ளர் தண்ணி குடிங்க. நீங்க இதுவரை வந்தது சாதாரணம் இல்ல.",
    en: "You're in a really hard minute right now — and it will pass. Take one slow, long breath with me… in… and out. This urge is a wave; it rises, and then it settles on its own. Drink a glass of water. How far you've come is not small.",
    mix: "Idhu romba hard minute, but it will pass. Ne slow-a oru deep breath edu… in… out. This craving is a wave — it rises and settles on its own. Konjam water kudi. You've come further than you think.",
  },
  caregiver: {
    en: "SAY:\n- I'm here with you, you're not alone in this.\n- We'll just get through the next few minutes together.\nAVOID:\n- Don't say \"just don't do it\" or lecture them.\n- Don't bring up past slips or make them promise anything right now.",
    ta: "SAY:\n- நான் உங்க கூடவே இருக்கேன், நீங்க தனியா இல்ல.\n- அடுத்த சில நிமிஷம் மட்டும் ஒன்னா கடந்துடலாம்.\nAVOID:\n- \"சும்மா செய்யாதே\" னு உபதேசம் பண்ணாதீங்க.\n- பழைய விஷயங்களை இப்போ பேசாதீங்க.",
    mix: "SAY:\n- Naan un kooda irukken, you're not alone.\n- Next few minutes mattum onnaa cross pannalaam.\nAVOID:\n- \"Just don't do it\" nu lecture pannadhinga.\n- Past slips  pathi ippo pesadhinga.",
  },
  checkin: {
    en: "Thank you for checking in — showing up like this counts. Whatever today held, you still chose to be honest with yourself, and that matters. Be a little gentle with yourself tonight. One small thing: put your phone down and take three slow breaths before the next thing you do.",
    ta: "செக்-இன் பண்ணதுக்கு நன்றி — இப்படி வர்றதே ஒரு பெரிய விஷயம். இன்னைக்கு எது நடந்தாலும், நீங்க நேர்மையா இருந்தீங்க. இன்னைக்கு உங்ககிட்ட கொஞ்சம் மென்மையா இருங்க. ஒரு சின்ன விஷயம்: மூன்று மெதுவான மூச்சு விடுங்க.",
    mix: "Check-in panninadhukku nandri — showing up itself counts. Whatever today held, you were honest, and that matters. Ne konjam gentle-a iru tonight. One small thing: moonu slow breath edu before your next thing.",
  },
  slip: {
    en: "This doesn't erase everything you've built — the days you've lived in recovery still count, all of them. A slip is one moment, not who you are. Be kind to yourself right now, the way you would to a friend. One small thing: reach out to one person and let them sit with you a while.",
    ta: "இது நீங்க கட்டி எழுப்பினதை அழிச்சிடாது — நீங்க வாழ்ந்த நாட்கள் எல்லாமே இன்னும் கணக்கு. ஒரு தவறு ஒரு கணம் மட்டுமே, அது நீங்க இல்ல. இப்போ உங்ககிட்ட கருணையா இருங்க. ஒரு சின்ன விஷயம்: ஒருத்தர்கிட்ட பேசுங்க.",
    mix: "Idhu ne build panninadha erase pannaadhu — the days you've lived still count, all of them. Oru slip is one moment, not who you are. Ne konjam kind-a iru to yourself now. One small thing: oru person kitta reach out pannu.",
  },
  swap: {
    en: "That money you'd spend today could be something you actually want instead. It adds up faster than it feels. Picture the thing you're saving toward for a second — it's closer than today makes it look. One small thing: move today's amount somewhere you can see it grow.",
    ta: "இன்னைக்கு செலவழிக்கிற பணம் நீங்க உண்மையா விரும்பறதா மாறலாம். அது நினைக்கிறதைவிட வேகமா சேரும். நீங்க சேமிக்கிறதை ஒரு நிமிஷம் கற்பனை பண்ணுங்க. ஒரு சின்ன விஷயம்: இன்னைக்கிய பணத்தை தனியா வெச்சு வளர்றதைப் பாருங்க.",
    mix: "Indha money you'd spend today could be something you actually want. It adds up faster than it feels. Ne save panradhu oru second imagine pannu. One small thing: today's amount-a somewhere you can see it grow-la move pannu.",
  },
  okay: {
    en: "You rode that out. I'm proud of you.",
    ta: "நீங்க அதைக் கடந்துட்டீங்க. உங்களை நினைச்சு பெருமைப்படுறேன்.",
    mix: "Ne adha cross panniten. I'm proud of you.",
  },
  onboarding: {
    en: "I've got you — from here on, you don't carry this alone. Whenever it gets heavy, I'll be one press away.",
    ta: "நான் உங்க கூடவே இருக்கேன் — இனிமே இதை நீங்க தனியா சுமக்க வேண்டாம். கஷ்டமா இருக்கும்போது, ஒரே ஒரு தட்டு தூரத்துல நான் இருப்பேன்.",
    mix: "I've got you — inime ne idha alone carry panna vendaam. Whenever it gets heavy, naan one press away iruppen.",
  },
};

export function offlineScript(surface: Surface, language: Language): string {
  return SCRIPTS[surface][language];
}
