// =============================================================================
// index.ts — Public surface of @anchor/core
// -----------------------------------------------------------------------------
// DECISION: Re-export the orchestration services, pure domain functions, seed
// data, and config so apps/api imports everything from one entrypoint.
// RATIONALE: A single barrel keeps the cross-lane import surface small and
// stable against the frozen contracts.
// =============================================================================

export { loadProviderConfig, type ProviderConfig } from "./config.js";
export {
  ProviderRouter,
  AllProvidersFailedError,
  type GenerateInput,
  type GenerateResult,
  type FetchLike,
  type RouterDeps,
} from "./provider-router.js";

export {
  detectCrisisLanguage,
  TELE_MANAS,
  type CrisisDetectionResult,
} from "./safety.js";

export { classifyCheckin, type CheckinClassification } from "./classify.js";

export {
  deriveRiskWindows,
  getActivePrediction,
  isNowInWindow,
  type ActivePrediction,
} from "./risk-windows.js";

export {
  buildSosPrompt,
  buildCaregiverPrompt,
  buildSlipPrompt,
  buildCheckinReflectionPrompt,
  buildInsightsPrompt,
  buildPredictionNudgePrompt,
  parseSlipOutput,
  timeOfDay,
  type BuiltPrompt,
} from "./prompts.js";

export { AnchorServices, describePattern } from "./services.js";

export { buildScenario, SCENARIO_IDS, type ScenarioSeed } from "./scenario.js";
