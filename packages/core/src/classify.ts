// =============================================================================
// classify.ts — Deterministic mood + risk classification for check-ins
// -----------------------------------------------------------------------------
// DECISION: Mood and risk are derived by a transparent lexicon scorer, then
// upgraded by the safety layer's crisis flag. This runs independently of the
// LLM so a check-in always yields a mood/risk even if generation fails, and the
// result is deterministic and unit-testable.
// RATIONALE: Risk classification gates escalation UI; it must be reproducible
// and must not silently depend on a live model. The AI is used for the *warm
// reflection*, not for the safety-critical label.
// =============================================================================

import type { MoodLabel, RiskLevel } from "@anchor/contracts";
import { detectCrisisLanguage } from "./safety.js";

interface Lexicon {
  mood: MoodLabel;
  /** Base risk contribution when these words dominate. */
  risk: number;
  words: string[];
}

// Higher `risk` = more concerning. Scores are summed per matched word.
const LEXICONS: Lexicon[] = [
  {
    mood: "positive",
    risk: -2,
    words: [
      "great","good","proud","happy","grateful","strong","hopeful","calm",
      "better","confident","celebrated","won","achieved","clear",
      "நன்றாக","மகிழ்ச்சி","பெருமை", // good, happy, proud
    ],
  },
  {
    mood: "calm",
    risk: -1,
    words: ["okay","fine","steady","relaxed","rested","peaceful","stable","அமைதி"],
  },
  {
    mood: "anxious",
    risk: 2,
    // Tamil anxiety terms are handled inflection-tolerantly in TAMIL_STEMS.
    words: [
      "anxious","nervous","worried","stressed","overwhelmed","pressure",
      "restless","tense","panic",
    ],
  },
  {
    mood: "low",
    risk: 3,
    // Tamil sadness/loneliness terms are in TAMIL_STEMS.
    words: [
      "sad","down","tired","lonely","empty","numb","exhausted","low","alone",
      "worthless","tearful",
    ],
  },
  {
    // Craving/urge is the single most decisive high-risk signal: one word here
    // should reach "high" on its own, whereas anxiety must accumulate.
    mood: "distressed",
    risk: 6,
    // Tamil craving/alcohol terms are in TAMIL_STEMS (inflection-tolerant).
    words: [
      "craving","urge","relapse","drink","drank","use","using","tempted",
      "can't cope","cant cope","breaking","desperate",
    ],
  },
];

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\s']/gu, " ").split(/\s+/).filter(Boolean);
}

// Tamil is agglutinative, so cravings/moods appear as inflected forms
// (குடிக்க, குடிக்கணும், …). We match these as STEMS via substring, keyed to a
// mood + risk, so inflection doesn't defeat detection. Ravi speaks Tamil, so
// this path is demo-critical.
const TAMIL_STEMS: { stem: string; mood: MoodLabel; risk: number }[] = [
  { stem: "குடி", mood: "distressed", risk: 6 }, // drink (any inflection)
  { stem: "மது", mood: "distressed", risk: 6 }, // alcohol
  { stem: "ஏக்க", mood: "distressed", risk: 6 }, // craving/longing
  { stem: "அழுத்த", mood: "anxious", risk: 2 }, // pressure/stress
  { stem: "பதட்ட", mood: "anxious", risk: 2 }, // anxiety
  { stem: "கவலை", mood: "anxious", risk: 2 }, // worry
  { stem: "தனிமை", mood: "low", risk: 3 }, // loneliness
  { stem: "சோக", mood: "low", risk: 3 }, // sadness
];

export interface CheckinClassification {
  mood: MoodLabel;
  riskLevel: RiskLevel;
  crisisFlag: boolean;
}

/**
 * Classify a check-in transcript into mood + risk. Crisis language forces
 * riskLevel to at least "high" (acute → "critical") regardless of lexicon.
 */
export function classifyCheckin(transcript: string): CheckinClassification {
  const tokens = tokenize(transcript);
  const scores = new Map<MoodLabel, number>();
  let riskScore = 0;
  let cravingPresent = false;

  for (const lex of LEXICONS) {
    let hits = 0;
    for (const w of lex.words) {
      // multi-word phrases: substring check on the raw text
      if (w.includes(" ")) {
        if (transcript.toLowerCase().includes(w)) hits++;
      } else if (tokens.includes(w)) {
        hits++;
      }
    }
    if (hits > 0) {
      scores.set(lex.mood, (scores.get(lex.mood) ?? 0) + hits);
      riskScore += hits * lex.risk;
      if (lex.mood === "distressed") cravingPresent = true;
    }
  }

  // Tamil stem pass (substring, inflection-tolerant).
  for (const { stem, mood, risk } of TAMIL_STEMS) {
    if (transcript.includes(stem)) {
      scores.set(mood, (scores.get(mood) ?? 0) + 1);
      riskScore += risk;
      if (mood === "distressed") cravingPresent = true;
    }
  }

  // Dominant mood = highest hit count; default to neutral when nothing matched.
  let mood: MoodLabel = "neutral";
  let best = 0;
  for (const [m, s] of scores) {
    if (s > best) {
      best = s;
      mood = m;
    }
  }

  // "high" (from wording) is reserved for an active craving/urge; mood words
  // like anxiety or sadness cap at "moderate" no matter how many stack.
  let riskLevel = riskScoreToLevel(riskScore, cravingPresent);

  // Safety override: crisis language is never below "high".
  const crisis = detectCrisisLanguage(transcript);
  if (crisis.flagged) {
    riskLevel = crisis.escalation?.severity === "acute" ? "critical" : "high";
  }

  return { mood, riskLevel, crisisFlag: crisis.flagged };
}

function riskScoreToLevel(score: number, cravingPresent: boolean): RiskLevel {
  // Only an active craving/urge escalates wording to "high"; other negative
  // moods (anxiety, sadness) stay at "moderate" however many words stack.
  if (cravingPresent && score >= 6) return "high";
  if (score >= 2) return "moderate";
  return "low";
}
