// =============================================================================
// safety.ts — Crisis-language detection & Tele-MANAS escalation
// -----------------------------------------------------------------------------
// DECISION: A deterministic, auditable keyword/phrase matcher (English + Tamil)
// runs on every check-in transcript BEFORE we trust an AI mood/risk label. On a
// match it returns a CrisisEscalation carrying Tele-MANAS / 14416 so the UI can
// surface the helpline immediately — independent of the LLM.
// RATIONALE: Safety escalation must never depend on a live model succeeding; a
// deterministic layer guarantees the helpline shows even if generation fails,
// and is fully unit-testable. Tamil patterns included because Ravi speaks Tamil.
//
// This is a supportive triage signal, NOT a clinical diagnosis.
// =============================================================================

import type { CrisisEscalation } from "@anchor/contracts";

export const TELE_MANAS = {
  name: "Tele-MANAS",
  number: "14416",
} as const;

type Severity = "elevated" | "acute";

interface CrisisPattern {
  category: string;
  severity: Severity;
  /** Lowercased phrases; matched as word-ish substrings on normalized text. */
  phrases: string[];
}

// Ordered so the most acute categories are checked first.
const PATTERNS: CrisisPattern[] = [
  {
    category: "suicidal-intent",
    severity: "acute",
    phrases: [
      "kill myself",
      "end my life",
      "end it all",
      "want to die",
      "better off dead",
      "no reason to live",
      "take my own life",
      "suicide",
      "suicidal",
      "not worth living",
      // Tamil
      "தற்கொலை", // suicide
      "சாக வேண்டும்", // want to die
      "இறந்து விட", // to die
      "உயிரை மாய்த்து", // take my life
    ],
  },
  {
    category: "self-harm",
    severity: "acute",
    phrases: [
      "hurt myself",
      "harm myself",
      "cut myself",
      "cutting myself",
      "self harm",
      "self-harm",
      "காயப்படுத்திக்", // hurt myself
    ],
  },
  {
    category: "hopelessness",
    severity: "elevated",
    phrases: [
      "no way out",
      "can't go on",
      "cant go on",
      "give up on everything",
      "nothing matters anymore",
      "everyone would be better without me",
      "hopeless",
      "no hope",
      "வழி இல்லை", // no way
      "நம்பிக்கை இல்லை", // no hope
    ],
  },
  {
    category: "overdose-risk",
    severity: "acute",
    phrases: [
      "overdose",
      "took too many",
      "whole bottle",
      "all the pills",
      "od on",
    ],
  },
];

export interface CrisisDetectionResult {
  flagged: boolean;
  escalation?: CrisisEscalation;
}

/** Normalize for matching: lowercase, collapse whitespace, strip most punct. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"'`()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detect crisis language in a check-in transcript. Returns a CrisisEscalation
 * (with Tele-MANAS / 14416) on the highest-severity match found.
 */
export function detectCrisisLanguage(transcript: string): CrisisDetectionResult {
  const text = normalize(transcript);
  if (!text) return { flagged: false };

  let match: { category: string; severity: Severity } | undefined;

  for (const pattern of PATTERNS) {
    const hit = pattern.phrases.some((p) => text.includes(normalize(p)));
    if (!hit) continue;
    // Prefer acute over a previously-found elevated match.
    if (!match || (match.severity === "elevated" && pattern.severity === "acute")) {
      match = { category: pattern.category, severity: pattern.severity };
    }
    if (pattern.severity === "acute") break; // acute is the ceiling
  }

  if (!match) return { flagged: false };

  const message =
    match.severity === "acute"
      ? "It sounds like you're going through something really painful right now. You don't have to face this alone — please reach out to Tele-MANAS at 14416. They're there for you, any time."
      : "That sounds really heavy to carry. If it would help to talk to someone right now, Tele-MANAS at 14416 is there for you.";

  return {
    flagged: true,
    escalation: {
      flagged: true,
      severity: match.severity,
      helplineName: TELE_MANAS.name,
      helplineNumber: TELE_MANAS.number,
      matchedCategory: match.category,
      message,
    },
  };
}
