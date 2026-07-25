// =============================================================================
// provider-router.ts — Live AI provider router (Cerebras → Gemini failover)
// -----------------------------------------------------------------------------
// DECISION: A single `generate()` entrypoint tries Cerebras first and fails over
// to Gemini on ANY error OR HTTP 429, returning AiMeta (provider, modelId,
// latencyMs, contextFields) with every response. `fetch` is injectable so the
// failover path is unit-testable without network access.
// RATIONALE: AGENTS.md mandates live-only generation with automatic failover and
// transparency metadata on every response; injecting fetch keeps that path
// deterministically testable at hour five.
// =============================================================================

import type { AiMeta, AiProvider } from "@anchor/contracts";
import { loadProviderConfig, type ProviderConfig } from "./config.js";

export interface GenerateInput {
  /** System instruction (tone/safety rules assembled by prompt templates). */
  system: string;
  /** User/content prompt (assembled persona context + task). */
  prompt: string;
  /** Field names sent into the prompt, surfaced in AiMeta.contextFields. */
  contextFields: string[];
  /** Soft cap on output length. */
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  meta: AiMeta;
}

/** Minimal fetch signature so tests can inject a fake. */
export type FetchLike = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export interface RouterDeps {
  config?: ProviderConfig;
  fetchImpl?: FetchLike;
  now?: () => number;
}

/** Error raised when BOTH providers fail — callers may fall back to offline. */
export class AllProvidersFailedError extends Error {
  constructor(
    public readonly cerebrasError: string,
    public readonly geminiError: string,
  ) {
    super(
      `All providers failed. cerebras="${cerebrasError}" gemini="${geminiError}"`,
    );
    this.name = "AllProvidersFailedError";
  }
}

const DEFAULT_MAX_TOKENS = 700;
const DEFAULT_TEMPERATURE = 0.7;

export class ProviderRouter {
  private readonly config: ProviderConfig;
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;

  constructor(deps: RouterDeps = {}) {
    this.config = deps.config ?? loadProviderConfig();
    this.fetchImpl = deps.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
    this.now = deps.now ?? (() => Date.now());
  }

  /**
   * Generate text with Cerebras, failing over to Gemini on error/429.
   * Always returns AiMeta. Throws AllProvidersFailedError if both fail.
   */
  async generate(input: GenerateInput): Promise<GenerateResult> {
    const started = this.now();

    // --- Primary: Cerebras --------------------------------------------------
    try {
      const text = await this.callCerebras(input);
      return this.wrap(text, "cerebras", this.config.cerebras.model, started, input);
    } catch (primaryErr) {
      const cerebrasError = errMessage(primaryErr);

      // --- Failover: Gemini -------------------------------------------------
      try {
        const text = await this.callGemini(input);
        return this.wrap(text, "gemini", this.config.gemini.model, started, input);
      } catch (failoverErr) {
        throw new AllProvidersFailedError(cerebrasError, errMessage(failoverErr));
      }
    }
  }

  private wrap(
    text: string,
    provider: AiProvider,
    modelId: string,
    started: number,
    input: GenerateInput,
  ): GenerateResult {
    return {
      text,
      meta: {
        provider,
        modelId,
        latencyMs: this.now() - started,
        contextFields: input.contextFields,
      },
    };
  }

  // --- Cerebras (OpenAI-compatible chat/completions) ------------------------
  private async callCerebras(input: GenerateInput): Promise<string> {
    const { baseUrl, apiKey, model } = this.config.cerebras;
    if (!apiKey) throw new Error("cerebras api key missing");

    const res = await this.withTimeout((signal) =>
      this.fetchImpl(`${trimSlash(baseUrl)}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.prompt },
          ],
          max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: input.temperature ?? DEFAULT_TEMPERATURE,
        }),
        signal,
      }),
    );

    // Treat 429 (and any non-2xx) as a failover trigger.
    if (res.status === 429) throw new Error("cerebras 429 rate limited");
    if (!res.ok) throw new Error(`cerebras http ${res.status}: ${await safeText(res)}`);

    const data = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    // gpt-oss-120b is a reasoning model: an empty content means it spent the
    // budget on hidden reasoning — treat as a failure so we fail over.
    if (!text) throw new Error("cerebras returned empty content");
    return text;
  }

  // --- Gemini (generativeLanguage generateContent) --------------------------
  private async callGemini(input: GenerateInput): Promise<string> {
    const { apiKey, model } = this.config.gemini;
    if (!apiKey) throw new Error("gemini api key missing");

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${model}:generateContent?key=${apiKey}`;

    const res = await this.withTimeout((signal) =>
      this.fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: [{ role: "user", parts: [{ text: input.prompt }] }],
          generationConfig: {
            maxOutputTokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
            temperature: input.temperature ?? DEFAULT_TEMPERATURE,
          },
        }),
        signal,
      }),
    );

    if (!res.ok) throw new Error(`gemini http ${res.status}: ${await safeText(res)}`);

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error("gemini returned empty content");
    return text;
  }

  private async withTimeout<T>(
    run: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      return await run(controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }
}

function trimSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function safeText(res: { text: () => Promise<string> }): Promise<string> {
  try {
    return (await res.text()).slice(0, 200);
  } catch {
    return "<no body>";
  }
}
