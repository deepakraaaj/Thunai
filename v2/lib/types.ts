// =============================================================================
// types.ts — Shared domain types for Thunai / Sahara v2.
// The Profile lives entirely in localStorage (no auth). Everything the AI needs
// about a person is here; API routes receive a sanitized copy of it.
// =============================================================================

export type Language = "en" | "ta" | "hi" | "tanglish" | "hinglish";

/** Which script the UI should render a language's text in (drives font choice). */
export type ScriptFamily = "latin" | "tamil" | "devanagari";

export function scriptFamily(lang: Language): ScriptFamily {
  switch (lang) {
    case "ta":
      return "tamil"; // pure Tamil script
    case "hi":
      return "devanagari"; // pure Hindi script
    // Tanglish/Hinglish are written in Latin (romanized), so latin renders them.
    default:
      return "latin";
  }
}

/** Font family class for a language's body/heading text. */
export function fontClassFor(lang: Language): string {
  switch (scriptFamily(lang)) {
    case "tamil":
      return "font-tamil";
    case "devanagari":
      return "font-devanagari";
    default:
      return "font-display";
  }
}

/** Speech / TTS locale for a language. */
export function localeFor(lang: Language): "en-IN" | "ta-IN" | "hi-IN" {
  switch (lang) {
    case "en":
      return "en-IN";
    case "ta":
    case "tanglish":
      return "ta-IN";
    case "hi":
    case "hinglish":
      return "hi-IN";
  }
}

/** User-facing brand: Sahara in Hindi modes, Thunai everywhere else. */
export function brandName(lang: Language): "Thunai" | "Sahara" {
  return lang === "hi" || lang === "hinglish" ? "Sahara" : "Thunai";
}

export type Substance = "Alcohol" | "Tobacco" | "Drugs" | "Something else";

export type Stage = "just-starting" | "few-weeks" | "few-months" | "six-plus";

export type Trigger =
  | "Work stress"
  | "Loneliness"
  | "Evenings"
  | "Friends who use"
  | "Family tension";

export type DoingItFor = "Myself" | "My child" | "Partner" | "Parents";

export type Desire = "Good food" | "A gadget" | "For my child" | "Saving up";

/** Days seeded by the chosen recovery stage. */
export const STAGE_DAYS: Record<Stage, number> = {
  "just-starting": 3,
  "few-weeks": 21,
  "few-months": 90,
  "six-plus": 200,
};

export interface Profile {
  name: string;
  substance: Substance;
  stage: Stage;
  startDays: number; // days already in recovery when profile created
  createdAt: number; // epoch ms — used to grow the counter over time
  trigger: Trigger;
  doingItFor: DoingItFor;
  lovedOneName?: string;
  supporterName?: string;
  supporterPhone?: string;
  dailySpend: number; // rupees/day
  desire: Desire;
  language: Language;
  isSample?: boolean;
}

/** Transparency metadata returned on every live generation. */
export interface AiMeta {
  provider: "cerebras" | "gemini" | "offline";
  modelId: string;
  latencyMs: number;
  isOfflineFallback?: boolean;
}

export interface ScriptResponse {
  text: string;
  meta: AiMeta;
}

export interface CheckinResponse {
  mood: string;
  riskLevel: "low" | "medium" | "high";
  reflection: string;
  meta: AiMeta;
}

export interface SlipResponse {
  text: string;
  whatsappDraft: string;
  meta: AiMeta;
}

export interface SwapResponse {
  text: string;
  meta: AiMeta;
}

export type EventType = "sos" | "checkin" | "slip" | "swap" | "okay";

export interface AnchorEvent {
  id: string;
  type: EventType;
  user_name: string;
  payload: Record<string, unknown>;
  created_at: string;
}
