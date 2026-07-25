// =============================================================================
// config.ts — Provider + runtime configuration (backend-only secrets)
// -----------------------------------------------------------------------------
// DECISION: All secrets/URLs are read from environment; core never hardcodes a
// key. Model ids default to the LIVE-VERIFIED values (Cerebras gpt-oss-120b;
// Gemini gemini-flash-lite-latest) but are env-overridable so a human can pin a
// different id without a code change.
// RATIONALE: AGENTS.md — backend-only keys, no hardcoded secrets/URLs, and the
// requested gemini-2.5-flash-lite id 404s for new users (see PROPOSALS.md).
// =============================================================================

export interface ProviderConfig {
  cerebras: {
    baseUrl: string;
    apiKey: string;
    model: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  /** Per-request timeout (ms) before a provider is considered failed. */
  timeoutMs: number;
}

/** Reads provider config from a process-env-like object (defaults injected). */
export function loadProviderConfig(
  env: Record<string, string | undefined> = process.env,
): ProviderConfig {
  return {
    cerebras: {
      baseUrl: env.LLM_BASE_URL ?? "https://api.cerebras.ai/v1",
      apiKey: env.LLM_API_KEY ?? "",
      model: env.LLM_MODEL ?? "gpt-oss-120b",
    },
    gemini: {
      // Accept either spelling of the key seen in this repo's .env.
      apiKey: env.GEMINI_API_KEY ?? env.Gemini_API_KEY ?? "",
      // Verified-working stable Flash-Lite alias (2.5-flash-lite id 404s).
      model: env.GEMINI_MODEL ?? "gemini-flash-lite-latest",
    },
    timeoutMs: Number(env.LLM_TIMEOUT_MS ?? "20000"),
  };
}
