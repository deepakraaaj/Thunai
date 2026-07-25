// =============================================================================
// packages/contracts/types.ts — SHARED CONTRACT TYPES (FROZEN AFTER 0:45)
// -----------------------------------------------------------------------------
// DECISION: One canonical TypeScript module is the single source of truth for
// every cross-lane shape. Frontend (apps/web) imports these to render; backend
// (apps/api) mirrors them to validate (Zod) and serialize. Core (packages/core)
// produces them. No lane invents a divergent shape — gaps go to PROPOSALS.md.
// RATIONALE: A structural contract expressed in types prevents shape collisions
// across three parallel agents better than prose alone.
//
// Product: "Anchor" — web-only, mobile-first recovery & prevention platform for
// substance use disorders. Personas: `individual` (Ravi) and `caregiver`.
// All AI outputs are LIVE (Cerebras primary → Gemini failover) and carry
// transparency metadata (provider, modelId, latencyMs, contextFields).
// =============================================================================

// ---------------------------------------------------------------------------
// Primitives & enums
// ---------------------------------------------------------------------------

/** ISO-8601 timestamp string, e.g. "2026-07-25T21:30:00.000Z". */
export type IsoTimestamp = string;

/** Opaque identifiers. Kept as branded-ish string aliases for readability. */
export type UserId = string;
export type CaregiverId = string;
export type EventId = string;
export type SosEventId = string;

export type Persona = "individual" | "caregiver";

/** Substances the scenario supports. Extend only via PROPOSALS.md. */
export type Substance = "alcohol" | "opioids" | "tobacco" | "cannabis" | "other";

/** BCP-47-ish language tags used for AI output + STT. */
export type LanguageCode = "ta" | "en" | "hi";

/** Which live provider actually produced a given AI response. */
export type AiProvider = "cerebras" | "gemini" | "offline";

/** Coarse mood label returned by check-in reflection. */
export type MoodLabel =
  | "positive"
  | "calm"
  | "neutral"
  | "anxious"
  | "low"
  | "distressed";

/** Risk level attached to a check-in or a prediction window. */
export type RiskLevel = "low" | "moderate" | "high" | "critical";

/** Kinds of events that appear on a user's timeline. */
export type TimelineEventType =
  | "sos"
  | "checkin"
  | "slip"
  | "milestone"
  | "prediction";

/** Recovery stage buckets derived from days sober. */
export type RecoveryStage =
  | "early" // 0–29 days
  | "building" // 30–89 days
  | "established" // 90+ days
  | "maintenance"; // 365+ days

// ---------------------------------------------------------------------------
// AI transparency metadata — attached to EVERY live-generated response
// ---------------------------------------------------------------------------

/**
 * Transparency block returned with every AI-generated payload.
 * `offline` is permitted ONLY as the labeled pre-written safety fallback.
 */
export interface AiMeta {
  provider: AiProvider;
  /** Exact model id, e.g. "gpt-oss-120b" or "gemini-flash-lite-latest". */
  modelId: string;
  /** End-to-end generation latency in milliseconds. */
  latencyMs: number;
  /** Names of the persona/context fields sent into the prompt (no values). */
  contextFields: string[];
  /**
   * True only for the labeled offline safety script. UIs MUST show the exact
   * label "Offline safety script (pre-written)" when this is true.
   */
  isOfflineFallback?: boolean;
}

// ---------------------------------------------------------------------------
// Persona / profile model (seeded by /api/scenario/load — INPUT ONLY)
// ---------------------------------------------------------------------------

export interface UserProfile {
  userId: UserId;
  name: string;
  persona: "individual";
  substance: Substance;
  /** Days sober as of profile creation; timeline milestones update UI. */
  daysSober: number;
  stage: RecoveryStage;
  /** Primary trigger, e.g. "work stress", "loneliness". */
  trigger: string;
  /** Motivation anchor, e.g. "daughter Ananya". */
  motivation: string;
  language: LanguageCode;
  /** Daily cost of use in INR (fuels money-saved framing). Optional. */
  dailyCostInr?: number;
  createdAt: IsoTimestamp;
}

export interface CaregiverProfile {
  caregiverId: CaregiverId;
  name: string;
  persona: "caregiver";
  language: LanguageCode;
  createdAt: IsoTimestamp;
}

// ---------------------------------------------------------------------------
// Check-in history (seeded + created live)
// ---------------------------------------------------------------------------

export interface CheckinRecord {
  id: EventId;
  userId: UserId;
  createdAt: IsoTimestamp;
  /** Raw transcript from browser STT (or typed). */
  transcript: string;
  mood: MoodLabel;
  riskLevel: RiskLevel;
  /** True when crisis-language was detected in the transcript. */
  crisisFlag: boolean;
}

// ===========================================================================
// ENDPOINT REQUEST / RESPONSE CONTRACTS
// ===========================================================================

// --- POST /api/scripts/sos --------------------------------------------------
export interface SosRequest {
  userId: UserId;
}
export interface SosResponse {
  /** The generated SOS script text, in the user's language. */
  script: string;
  language: LanguageCode;
  meta: AiMeta;
  /** Persisted timeline event id for this SOS moment. */
  sosEventId: SosEventId;
}

// --- POST /api/scripts/caregiver -------------------------------------------
export interface CaregiverScriptRequest {
  /** The SOS moment this coaching script responds to. */
  sosEventId: SosEventId;
}
export interface CaregiverScriptResponse {
  /** Coaching script for the caregiver: what to say / do right now. */
  script: string;
  language: LanguageCode;
  meta: AiMeta;
}

// --- POST /api/checkins -----------------------------------------------------
export interface CheckinRequest {
  userId: UserId;
  /** Transcript text produced by browser speech-to-text (or typed). */
  transcript: string;
}
export interface CheckinResponse {
  id: EventId;
  mood: MoodLabel;
  riskLevel: RiskLevel;
  /** Warm, non-clinical reflection ending in one small doable action. */
  aiReflection: string;
  /**
   * Escalation surfaced when crisis-language is detected. When present, the UI
   * MUST prominently show the Tele-MANAS helpline.
   */
  escalation?: CrisisEscalation;
  meta: AiMeta;
}

/** Emitted by the safety layer when crisis language is detected. */
export interface CrisisEscalation {
  flagged: true;
  severity: "elevated" | "acute";
  helplineName: string; // "Tele-MANAS"
  helplineNumber: string; // "14416"
  /** Short matched category, e.g. "self-harm", "hopelessness". */
  matchedCategory: string;
  message: string; // supportive UI copy
}

// --- POST /api/scripts/slip -------------------------------------------------
export interface SlipRequest {
  userId: UserId;
}
export interface SlipResponse {
  /** Compassionate, shame-free response to a slip/relapse. */
  script: string;
  /** Ready-to-send WhatsApp draft (e.g. to reach out to caregiver/support). */
  whatsappDraft: string;
  language: LanguageCode;
  meta: AiMeta;
  slipEventId: EventId;
}

// --- GET /api/timeline/:userId ---------------------------------------------
export interface TimelineEvent {
  id: EventId;
  type: TimelineEventType;
  at: IsoTimestamp;
  title: string;
  detail?: string;
  /** Present for checkin/prediction events. */
  riskLevel?: RiskLevel;
  mood?: MoodLabel;
}
export interface TimelineResponse {
  userId: UserId;
  events: TimelineEvent[]; // newest-first
}

// --- GET /api/insights/:userId ---------------------------------------------
export interface RiskWindow {
  /** 0=Sunday … 6=Saturday. */
  dayOfWeek: number;
  /** Local hour range [startHour, endHour) in 24h, e.g. 18–23. */
  startHour: number;
  endHour: number;
  riskLevel: RiskLevel;
  /** Human label, e.g. "Friday evening". */
  label: string;
  /** 0..1 confidence from history density. */
  confidence: number;
}
export interface InsightsResponse {
  userId: UserId;
  /** Weekly natural-language pattern summary (AI-generated, warm tone). */
  weeklySummary: string;
  riskWindows: RiskWindow[];
  meta: AiMeta;
}

// --- GET /api/predictions/:userId ------------------------------------------
export interface PredictionResponse {
  userId: UserId;
  /** True when `now` falls inside a derived risk window. */
  active: boolean;
  /** The window we are currently inside (present when active). */
  window?: RiskWindow;
  /** Pre-crisis nudge copy (present when active). */
  nudge?: string;
  /** AI meta present only when a nudge was generated live. */
  meta?: AiMeta;
}

// --- POST /api/link (caregiver consent linking) ----------------------------
export interface LinkRequest {
  caregiverId: CaregiverId;
  userId: UserId;
  /** Explicit consent from the individual is REQUIRED to create the link. */
  consent: true;
}
export interface LinkResponse {
  linkId: string;
  caregiverId: CaregiverId;
  userId: UserId;
  consent: true;
  linkedAt: IsoTimestamp;
}

// --- GET /api/caregiver/dashboard/:caregiverId -----------------------------
export interface LinkedUserStatus {
  userId: UserId;
  name: string;
  daysSober: number;
  latestRiskLevel: RiskLevel;
  /** Currently inside a risk window? Drives the "check on them" prompt. */
  inRiskWindowNow: boolean;
  latestEvents: TimelineEvent[]; // newest-first, capped
}
export interface CaregiverDashboardResponse {
  caregiverId: CaregiverId;
  /** Only users who granted consent appear here (consent-gated server-side). */
  linkedUsers: LinkedUserStatus[];
}

// --- POST /api/scenario/load (INPUT-ONLY seeding) --------------------------
/**
 * Seeds INPUT data only: profiles, check-in history, timeline events, links.
 * MUST NOT inject AI outputs, scripts, or fabricated model responses.
 */
export interface ScenarioLoadRequest {
  /** Optional: reset existing seed before loading. Defaults to true. */
  reset?: boolean;
}
export interface ScenarioLoadResponse {
  seeded: {
    users: UserId[];
    caregivers: CaregiverId[];
    checkins: number;
    timelineEvents: number;
    links: number;
  };
}

// ---------------------------------------------------------------------------
// Standard error envelope (all endpoints)
// ---------------------------------------------------------------------------
export interface ApiError {
  error: {
    code: string; // e.g. "not_found", "consent_required", "validation_error"
    message: string;
    details?: unknown;
  };
}
