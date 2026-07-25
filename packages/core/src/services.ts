// =============================================================================
// services.ts — Orchestration: prompts + router + safety → contract payloads
// -----------------------------------------------------------------------------
// DECISION: Thin async services compose the pure pieces (prompt builders,
// classifiers, safety, risk windows) with the live ProviderRouter and return
// contract-shaped payloads (script/meta/escalation). The backend (apps/api)
// owns persistence and calls these; core stays storage-agnostic.
// RATIONALE: Keeping orchestration here (not in apps/api) means the demo-
// critical AI behavior — tone, failover, escalation wiring — is owned and
// tested in one lane, and apps/api just supplies data + persistence.
// =============================================================================

import type {
  CheckinRecord,
  CrisisEscalation,
  LanguageCode,
  MoodLabel,
  RiskLevel,
  RiskWindow,
  UserProfile,
} from "@anchor/contracts";
import { classifyCheckin } from "./classify.js";
import {
  buildCaregiverPrompt,
  buildCheckinReflectionPrompt,
  buildInsightsPrompt,
  buildPredictionNudgePrompt,
  buildSlipPrompt,
  buildSosPrompt,
  parseSlipOutput,
} from "./prompts.js";
import { ProviderRouter, type GenerateResult } from "./provider-router.js";
import { detectCrisisLanguage } from "./safety.js";
import { deriveRiskWindows, getActivePrediction } from "./risk-windows.js";

export class AnchorServices {
  constructor(private readonly router: ProviderRouter = new ProviderRouter()) {}

  /** POST /api/scripts/sos → script + meta (persistence handled by caller). */
  async sosScript(profile: UserProfile, now: Date = new Date()) {
    const built = buildSosPrompt(profile, now);
    const out = await this.router.generate({
      system: built.system,
      prompt: built.prompt,
      contextFields: built.contextFields,
    });
    return { script: out.text, language: profile.language, meta: out.meta };
  }

  /** POST /api/scripts/caregiver → coaching script + meta. */
  async caregiverScript(
    profile: UserProfile,
    caregiverLanguage: LanguageCode,
    now: Date = new Date(),
  ) {
    const built = buildCaregiverPrompt(profile, caregiverLanguage, now);
    const out = await this.router.generate({
      system: built.system,
      prompt: built.prompt,
      contextFields: built.contextFields,
    });
    return { script: out.text, language: caregiverLanguage, meta: out.meta };
  }

  /**
   * POST /api/checkins → mood/risk (deterministic) + warm reflection (live) +
   * crisis escalation (deterministic). Escalation is computed BEFORE the AI
   * call so the helpline surfaces even if generation fails.
   */
  async checkin(profile: UserProfile, transcript: string, now: Date = new Date()) {
    const classification = classifyCheckin(transcript);
    const crisis = detectCrisisLanguage(transcript);

    const built = buildCheckinReflectionPrompt(
      profile,
      transcript,
      classification.mood,
      now,
    );
    const out = await this.router.generate({
      system: built.system,
      prompt: built.prompt,
      contextFields: built.contextFields,
    });

    const escalation: CrisisEscalation | undefined = crisis.escalation;
    return {
      mood: classification.mood as MoodLabel,
      riskLevel: classification.riskLevel as RiskLevel,
      aiReflection: out.text,
      crisisFlag: classification.crisisFlag,
      ...(escalation ? { escalation } : {}),
      meta: out.meta,
    };
  }

  /** POST /api/scripts/slip → compassionate response + WhatsApp draft. */
  async slipScript(profile: UserProfile, now: Date = new Date()) {
    const built = buildSlipPrompt(profile, now);
    const out = await this.router.generate({
      system: built.system,
      prompt: built.prompt,
      contextFields: built.contextFields,
    });
    const { script, whatsappDraft } = parseSlipOutput(out.text);
    return { script, whatsappDraft, language: profile.language, meta: out.meta };
  }

  /** GET /api/insights/:userId → risk windows (pure) + weekly summary (live). */
  async insights(profile: UserProfile, checkins: CheckinRecord[], now: Date = new Date()) {
    const riskWindows = deriveRiskWindows(checkins);
    const patternSummary = describePattern(riskWindows, checkins);
    const built = buildInsightsPrompt(profile, patternSummary, now);
    const out = await this.router.generate({
      system: built.system,
      prompt: built.prompt,
      contextFields: built.contextFields,
    });
    return { weeklySummary: out.text, riskWindows, meta: out.meta };
  }

  /**
   * GET /api/predictions/:userId → active pre-crisis nudge if `now` is inside a
   * derived risk window. No AI call when not active.
   */
  async prediction(profile: UserProfile, checkins: CheckinRecord[], now: Date = new Date()) {
    const active = getActivePrediction(checkins, now);
    if (!active.active || !active.window) {
      return { active: false as const };
    }
    const built = buildPredictionNudgePrompt(profile, active.window.label, now);
    const out: GenerateResult = await this.router.generate({
      system: built.system,
      prompt: built.prompt,
      contextFields: built.contextFields,
    });
    return {
      active: true as const,
      window: active.window,
      nudge: out.text,
      meta: out.meta,
    };
  }
}

/** Turn derived windows + counts into a plain-language pattern summary. */
export function describePattern(
  windows: RiskWindow[],
  checkins: CheckinRecord[],
): string {
  const total = checkins.length;
  if (windows.length === 0) {
    return `Across ${total} check-ins there is no strong recurring risk pattern yet; mood has been fairly steady.`;
  }
  const top = windows[0]!;
  const others = windows.slice(1).map((w) => w.label);
  const parts = [
    `Across ${total} check-ins, the hardest recurring window is ${top.label} (risk: ${top.riskLevel}).`,
  ];
  if (others.length) parts.push(`Other tougher times: ${others.join(", ")}.`);
  parts.push("Most other check-ins have been steady.");
  return parts.join(" ");
}
