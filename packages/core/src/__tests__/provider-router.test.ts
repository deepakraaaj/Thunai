// Tests for the provider router: metadata, Cerebras→Gemini failover, both-fail.
import { describe, it, expect } from "vitest";
import {
  ProviderRouter,
  AllProvidersFailedError,
  type FetchLike,
} from "../provider-router.js";
import type { ProviderConfig } from "../config.js";

const config: ProviderConfig = {
  cerebras: { baseUrl: "https://cerebras.test/v1", apiKey: "ck", model: "gpt-oss-120b" },
  gemini: { apiKey: "gk", model: "gemini-flash-lite-latest" },
  timeoutMs: 5000,
};

function jsonRes(status: number, body: unknown): Awaited<ReturnType<FetchLike>> {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const cerebrasBody = (content: string) => ({ choices: [{ message: { content } }] });
const geminiBody = (text: string) => ({ candidates: [{ content: { parts: [{ text }] } }] });

describe("ProviderRouter", () => {
  it("uses Cerebras first and reports provider/model/contextFields + latency", async () => {
    const fetchImpl: FetchLike = async (url) => {
      expect(url).toContain("cerebras.test");
      return jsonRes(200, cerebrasBody("hi from cerebras"));
    };
    let t = 1000;
    const router = new ProviderRouter({ config, fetchImpl, now: () => (t += 50) });
    const r = await router.generate({ system: "s", prompt: "p", contextFields: ["name"] });
    expect(r.text).toBe("hi from cerebras");
    expect(r.meta.provider).toBe("cerebras");
    expect(r.meta.modelId).toBe("gpt-oss-120b");
    expect(r.meta.contextFields).toEqual(["name"]);
    expect(r.meta.latencyMs).toBeGreaterThan(0);
  });

  it("fails over to Gemini on Cerebras 429", async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes("cerebras.test")) return jsonRes(429, { error: "rate" });
      return jsonRes(200, geminiBody("hi from gemini"));
    };
    const router = new ProviderRouter({ config, fetchImpl });
    const r = await router.generate({ system: "s", prompt: "p", contextFields: [] });
    expect(r.text).toBe("hi from gemini");
    expect(r.meta.provider).toBe("gemini");
    expect(r.meta.modelId).toBe("gemini-flash-lite-latest");
  });

  it("fails over when Cerebras returns empty content (reasoning-only)", async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes("cerebras.test")) return jsonRes(200, cerebrasBody("   "));
      return jsonRes(200, geminiBody("gemini rescued it"));
    };
    const router = new ProviderRouter({ config, fetchImpl });
    const r = await router.generate({ system: "s", prompt: "p", contextFields: [] });
    expect(r.meta.provider).toBe("gemini");
    expect(r.text).toBe("gemini rescued it");
  });

  it("fails over on a thrown network error", async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes("cerebras.test")) throw new Error("ECONNRESET");
      return jsonRes(200, geminiBody("ok"));
    };
    const router = new ProviderRouter({ config, fetchImpl });
    const r = await router.generate({ system: "s", prompt: "p", contextFields: [] });
    expect(r.meta.provider).toBe("gemini");
  });

  it("throws AllProvidersFailedError when both fail", async () => {
    const fetchImpl: FetchLike = async (url) => {
      if (url.includes("cerebras.test")) return jsonRes(500, { e: 1 });
      return jsonRes(503, { e: 2 });
    };
    const router = new ProviderRouter({ config, fetchImpl });
    await expect(
      router.generate({ system: "s", prompt: "p", contextFields: [] }),
    ).rejects.toBeInstanceOf(AllProvidersFailedError);
  });
});
