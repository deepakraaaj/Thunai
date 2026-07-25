// =============================================================================
// route-utils.ts — Shared helpers for API routes: bounded body parsing, safe
// JSON responses, and a generation wrapper that attaches an offline fallback
// with honest metadata when both providers fail. Never echoes key material or
// internal error strings to the client.
// =============================================================================

import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { generateText, offlineMeta, AllProvidersFailedError, type GenResult } from "./ai";

const MAX_BODY_BYTES = 16 * 1024; // 16KB — profiles + transcripts are tiny
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;

type RateEntry = { count: number; resetAt: number };
const rateStore = new Map<string, RateEntry>();

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  return `${ip}:${new URL(req.url).pathname}`;
}

function rateLimit(req: Request): NextResponse | null {
  const now = Date.now();
  const key = clientKey(req);
  const current = rateStore.get(key);

  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }
  if (current.count >= RATE_LIMIT) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(retryAfter),
        },
      },
    );
  }
  current.count += 1;
  return null;
}

export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; res: NextResponse }> {
  const limited = rateLimit(req);
  if (limited) return { ok: false, res: limited };

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return { ok: false, res: json({ error: "payload_too_large" }, 413) };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, res: json({ error: "invalid_json" }, 400) };
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, res: json({ error: "invalid_input" }, 400) };
  }
  return { ok: true, data: result.data };
}

export function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Run a live generation; on total provider failure, return the caller's offline
 * script with honest offline metadata (never as live AI).
 */
export async function generateOrOffline(
  system: string,
  user: string,
  offlineText: string,
): Promise<GenResult> {
  try {
    return await generateText(system, user);
  } catch (err) {
    if (err instanceof AllProvidersFailedError) {
      return { text: offlineText, meta: offlineMeta() };
    }
    // Unexpected — still degrade gracefully, never leak the error.
    console.error("[route] unexpected generation error:", err);
    return { text: offlineText, meta: offlineMeta() };
  }
}
