// =============================================================================
// types.ts — Shared domain types for Anchor v2.
// The Profile lives entirely in localStorage (no auth). Everything the AI needs
// about a person is here; API routes receive a sanitized copy of it.
// =============================================================================

export type Language = "ta" | "en" | "mix";

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
