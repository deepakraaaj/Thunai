// =============================================================================
// prompts.ts — Persona-aware prompt assembly for every AI surface
// -----------------------------------------------------------------------------
// DECISION: One shared SYSTEM_RULES block encodes Anchor's voice (warm,
// non-clinical, user's language, ends with ONE small doable action, never
// guilt/shame/clinical jargon). Each builder layers a task-specific instruction
// on top of assembled persona context. Every builder returns the exact
// contextFields it used, so the router can report them in AiMeta.
// RATIONALE: Centralizing the voice rules guarantees consistency across sos /
// caregiver / slip / checkin-reflection / insights, and returning contextFields
// keeps transparency metadata honest and testable.
// =============================================================================

import type { LanguageCode, UserProfile } from "@anchor/contracts";

const LANGUAGE_NAME: Record<LanguageCode, string> = {
  ta: "Tamil",
  en: "English",
  hi: "Hindi",
};

/** Human time-of-day bucket for warmth/context. */
export function timeOfDay(now: Date = new Date()): string {
  const h = (now.getUTCHours() + 5) % 24; // rough IST hour
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "late night";
}

/** The non-negotiable voice of Anchor, injected as the system message. */
function systemRules(language: LanguageCode): string {
  return [
    "You are Anchor, a warm, steady companion for someone recovering from a substance use disorder.",
    `Write your ENTIRE response in ${LANGUAGE_NAME[language]}. Do not mix in other languages.`,
    "Voice rules you must always follow:",
    "- Be warm, human, and encouraging — like a trusted friend, never a doctor or a form.",
    "- Never use guilt, shame, blame, or moralizing. Never call the person an addict.",
    "- Never use clinical or diagnostic jargon (no 'disorder', 'relapse prevention plan', 'intervention', 'sobriety metrics').",
    "- Keep it short and speakable: a few plain sentences, not a lecture.",
    "- End with exactly ONE small, concrete, doable action they can take in the next few minutes.",
    "- Do not give medical advice or dosages. If they are in danger, gently point to human help.",
  ].join("\n");
}

/** Assemble the persona context lines + the field names used. */
function personaContext(
  profile: UserProfile,
  now: Date,
): { block: string; fields: string[] } {
  const fields = [
    "name",
    "substance",
    "stage",
    "daysSober",
    "trigger",
    "motivation",
    "language",
    "timeOfDay",
  ];
  const block = [
    `Person's name: ${profile.name}`,
    `What they're recovering from: ${profile.substance}`,
    `Recovery stage: ${profile.stage} (${profile.daysSober} days)`,
    `Their main trigger: ${profile.trigger}`,
    `What keeps them going: ${profile.motivation}`,
    `Time of day right now: ${timeOfDay(now)}`,
  ].join("\n");
  return { block, fields };
}

export interface BuiltPrompt {
  system: string;
  prompt: string;
  contextFields: string[];
}

// --- SOS: in-the-moment craving/crisis ------------------------------------
export function buildSosPrompt(profile: UserProfile, now: Date = new Date()): BuiltPrompt {
  const ctx = personaContext(profile, now);
  return {
    system: systemRules(profile.language),
    prompt: [
      ctx.block,
      "",
      `${profile.name} just hit the SOS button — a craving or urge is hitting hard RIGHT NOW.`,
      "Give them something to hold onto this minute. Acknowledge how hard this moment is,",
      "remind them gently of what keeps them going, and get them through the next few minutes.",
      "End with one tiny action they can do right now (a breath, a sip of water, a text to someone).",
    ].join("\n"),
    contextFields: ctx.fields,
  };
}

// --- Caregiver coaching in response to an SOS -----------------------------
export function buildCaregiverPrompt(
  profile: UserProfile,
  caregiverLanguage: LanguageCode,
  now: Date = new Date(),
): BuiltPrompt {
  const ctx = personaContext(profile, now);
  return {
    system: systemRules(caregiverLanguage),
    prompt: [
      ctx.block,
      "",
      `${profile.name} just reached out in an SOS moment. You are coaching the person who cares for them`,
      "(a family member or friend) on how to respond in the next few minutes.",
      "Tell the caregiver, plainly: what to say, what NOT to say, and how to be present.",
      "No lectures, no clinical language, no blame toward anyone.",
      "End with one small thing the caregiver can do right now to help.",
    ].join("\n"),
    contextFields: [...ctx.fields, "caregiverLanguage"],
  };
}

// --- Slip / relapse: compassionate response + WhatsApp draft --------------
export function buildSlipPrompt(profile: UserProfile, now: Date = new Date()): BuiltPrompt {
  const ctx = personaContext(profile, now);
  return {
    system: systemRules(profile.language),
    prompt: [
      ctx.block,
      "",
      `${profile.name} had a slip and used again. They may feel like they failed.`,
      "Respond with pure compassion. A slip is part of recovery, not the end of it.",
      "Absolutely no shame, no 'you should have', no starting over from zero framing.",
      "Then write a short, ready-to-send WhatsApp message they could send to someone who supports them,",
      "asking for a little help or company right now.",
      "",
      "Format your reply as exactly two labeled parts:",
      "RESPONSE: <the compassionate message to them>",
      "WHATSAPP: <the message they can paste into WhatsApp>",
    ].join("\n"),
    contextFields: ctx.fields,
  };
}

// --- Check-in reflection ---------------------------------------------------
export function buildCheckinReflectionPrompt(
  profile: UserProfile,
  transcript: string,
  mood: string,
  now: Date = new Date(),
): BuiltPrompt {
  const ctx = personaContext(profile, now);
  return {
    system: systemRules(profile.language),
    prompt: [
      ctx.block,
      `Detected mood: ${mood}`,
      "",
      `${profile.name} just did a daily check-in. Here is what they said:`,
      `"""${transcript}"""`,
      "",
      "Reflect back warmly what you heard — make them feel seen, not analyzed.",
      "Notice one genuine thing to affirm. Do not diagnose or label them.",
      "End with one small doable action that fits how they're feeling right now.",
    ].join("\n"),
    contextFields: [...ctx.fields, "transcript", "mood"],
  };
}

// --- Weekly insights summary ----------------------------------------------
export function buildInsightsPrompt(
  profile: UserProfile,
  patternSummary: string,
  now: Date = new Date(),
): BuiltPrompt {
  const ctx = personaContext(profile, now);
  return {
    system: systemRules(profile.language),
    prompt: [
      ctx.block,
      "",
      "Here is a plain-language summary of patterns from their check-ins this week:",
      `"""${patternSummary}"""`,
      "",
      `Turn this into a short, encouraging weekly note to ${profile.name}.`,
      "Frame any risky pattern as something to gently plan around, never as a failing.",
      "Celebrate any progress you can see.",
      "End with one small doable action to help them through their riskiest window.",
    ].join("\n"),
    contextFields: [...ctx.fields, "patternSummary"],
  };
}

// --- Pre-crisis prediction nudge ------------------------------------------
export function buildPredictionNudgePrompt(
  profile: UserProfile,
  windowLabel: string,
  now: Date = new Date(),
): BuiltPrompt {
  const ctx = personaContext(profile, now);
  return {
    system: systemRules(profile.language),
    prompt: [
      ctx.block,
      "",
      `Right now is ${profile.name}'s historically hardest time: ${windowLabel}.`,
      "They are okay this second — this is a gentle, proactive check-in BEFORE any craving hits.",
      "Reach out warmly, name that this window can be tough, and remind them they've got through it before.",
      "No alarm, no clinical warning language.",
      "End with one small doable action to steady them for the next hour.",
    ].join("\n"),
    contextFields: [...ctx.fields, "windowLabel"],
  };
}

/** Split a slip generation into its RESPONSE / WHATSAPP parts. */
export function parseSlipOutput(raw: string): { script: string; whatsappDraft: string } {
  const respMatch = raw.match(/RESPONSE:\s*([\s\S]*?)(?:WHATSAPP:|$)/i);
  const waMatch = raw.match(/WHATSAPP:\s*([\s\S]*)$/i);
  const script = respMatch?.[1]?.trim() || raw.trim();
  const whatsappDraft =
    waMatch?.[1]?.trim() ||
    "Hey, I'm having a rough moment and could use a little company. Can we talk?";
  return { script, whatsappDraft };
}
