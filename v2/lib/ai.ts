// =============================================================================
// ai.ts — Live generation ladder (server-only). Cerebras → Gemini → offline.
// -----------------------------------------------------------------------------
// DECISION: Every AI surface calls generateText(). It tries Cerebras first
// (fastest Llama-class model, auto-discovered), retries transient failures with
// backoff + jitter, then fails over to Gemini Flash-Lite with the same retry
// policy, and only if BOTH are exhausted returns a caller-supplied offline
// script tagged provider:"offline", isOfflineFallback:true.
// RATIONALE: Live-only is a disqualification rule. The ladder guarantees the UI
// never sees an unhandled rejection and never shows a canned script as live AI.
// =============================================================================

import "server-only";
import type { AiMeta } from "./types";

const PER_ATTEMPT_TIMEOUT_MS = 8000;
const BACKOFFS_MS = [400, 900]; // 2 retries after the first try

export interface GenResult {
  text: string;
  meta: AiMeta;
}

export class AllProvidersFailedError extends Error {
  constructor() {
    super("all_providers_failed");
    this.name = "AllProvidersFailedError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms + Math.floor(Math.random() * 150)));
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---- Cerebras model discovery (cached for the process) --------------------

let cachedCerebrasModel: string | null = null;

// The known-good default for this account. Model discovery may upgrade this to a
// faster small model if one is served, but we NEVER cache a blind guess that
// could 404 the completions endpoint — only IDs the /models list actually returns.
const CEREBRAS_DEFAULT = "gpt-oss-120b";

// Preference order (fastest first) among small, fast models Cerebras may serve.
// Anything here must be matched against the live /models list before use.
const CEREBRAS_PREFERRED = [
  "llama-3.1-8b",
  "llama3.1-8b",
  "llama-3.3-70b",
  "gemma-4-31b",
  "gpt-oss-120b",
];

async function pickCerebrasModel(baseUrl: string, key: string): Promise<string> {
  if (process.env.CEREBRAS_MODEL) return process.env.CEREBRAS_MODEL;
  if (cachedCerebrasModel) return cachedCerebrasModel;
  try {
    const res = await fetchWithTimeout(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) {
      const body = (await res.json()) as { data?: Array<{ id: string }> };
      const ids = (body.data ?? []).map((m) => m.id);
      // Only ever return a model the account actually serves.
      for (const pref of CEREBRAS_PREFERRED) {
        if (ids.includes(pref)) {
          cachedCerebrasModel = pref;
          return pref;
        }
      }
      if (ids.includes(CEREBRAS_DEFAULT)) {
        cachedCerebrasModel = CEREBRAS_DEFAULT;
        return CEREBRAS_DEFAULT;
      }
      if (ids[0]) {
        cachedCerebrasModel = ids[0];
        return ids[0];
      }
    }
  } catch {
    // discovery failed transiently — use the known-good default WITHOUT caching,
    // so the next request can still discover a better/valid model.
  }
  return CEREBRAS_DEFAULT;
}

// ---- Cerebras generation --------------------------------------------------

async function callCerebras(system: string, user: string): Promise<GenResult> {
  const key = process.env.CEREBRAS_API_KEY;
  const baseUrl = process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1";
  if (!key) throw new Error("no_cerebras_key");

  const model = await pickCerebrasModel(baseUrl, key);
  const started = Date.now();
  let lastErr: unknown;

  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
    try {
      const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 400,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) {
        if (isRetryable(res.status) && attempt < BACKOFFS_MS.length) {
          await sleep(BACKOFFS_MS[attempt]!);
          continue;
        }
        throw new Error(`cerebras_${res.status}`);
      }
      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = body.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("cerebras_empty");
      return {
        text,
        meta: {
          provider: "cerebras",
          modelId: model,
          latencyMs: Date.now() - started,
        },
      };
    } catch (err) {
      lastErr = err;
      const transient =
        err instanceof Error &&
        (err.name === "AbortError" || err.message === "cerebras_empty");
      if (transient && attempt < BACKOFFS_MS.length) {
        await sleep(BACKOFFS_MS[attempt]!);
        continue;
      }
      if (attempt >= BACKOFFS_MS.length) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("cerebras_failed");
}

// ---- Gemini failover ------------------------------------------------------

async function callGemini(system: string, user: string): Promise<GenResult> {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  if (!key) throw new Error("no_gemini_key");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const started = Date.now();
  let lastErr: unknown;

  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
    try {
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      });
      if (!res.ok) {
        if (isRetryable(res.status) && attempt < BACKOFFS_MS.length) {
          await sleep(BACKOFFS_MS[attempt]!);
          continue;
        }
        throw new Error(`gemini_${res.status}`);
      }
      const body = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = body.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim();
      if (!text) throw new Error("gemini_empty");
      return {
        text,
        meta: { provider: "gemini", modelId: model, latencyMs: Date.now() - started },
      };
    } catch (err) {
      lastErr = err;
      const transient =
        err instanceof Error &&
        (err.name === "AbortError" || err.message === "gemini_empty");
      if (transient && attempt < BACKOFFS_MS.length) {
        await sleep(BACKOFFS_MS[attempt]!);
        continue;
      }
      if (attempt >= BACKOFFS_MS.length) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("gemini_failed");
}

// ---- Public ladder --------------------------------------------------------

/**
 * Live-only generation. Returns text + transparency meta. If BOTH providers are
 * exhausted, throws AllProvidersFailedError so the route can attach a clearly
 * labeled offline script (provider:"offline", isOfflineFallback:true).
 */
export async function generateText(system: string, user: string): Promise<GenResult> {
  const started = Date.now();
  try {
    return await callCerebras(system, user);
  } catch (cerebrasErr) {
    console.warn(
      `[ai] cerebras failed after ${Date.now() - started}ms:`,
      cerebrasErr instanceof Error ? cerebrasErr.message : cerebrasErr,
    );
  }
  try {
    return await callGemini(system, user);
  } catch (geminiErr) {
    console.warn(
      "[ai] gemini failover failed:",
      geminiErr instanceof Error ? geminiErr.message : geminiErr,
    );
  }
  throw new AllProvidersFailedError();
}

/** Build the offline meta for a labeled pre-written fallback. */
export function offlineMeta(): AiMeta {
  return {
    provider: "offline",
    modelId: "pre-written",
    latencyMs: 0,
    isOfflineFallback: true,
  };
}
