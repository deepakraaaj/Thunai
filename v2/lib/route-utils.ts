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

export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; res: NextResponse }> {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
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
  return NextResponse.json(body, { status });
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
