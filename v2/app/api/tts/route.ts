// =============================================================================
// /api/tts — Sarvam TTS proxy (server-only key). Returns { audioBase64 } on
// success. On any failure (incl. missing key), returns 502 so the client voice
// ladder falls through to browser speechSynthesis. Never leaks the key/errors.
// =============================================================================

import { ttsSchema } from "@/lib/schema";
import { parseBody, json } from "@/lib/route-utils";

export const runtime = "nodejs";

const SARVAM_TIMEOUT_MS = 5000;

export async function POST(req: Request) {
  const parsed = await parseBody(req, ttsSchema);
  if (!parsed.ok) return parsed.res;

  const key = process.env.SARVAM_API_KEY;
  if (!key) return json({ error: "tts_unavailable" }, 502);

  const { text, targetLanguageCode } = parsed.data;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SARVAM_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        target_language_code: targetLanguageCode,
        model: "bulbul:v2",
        speaker: targetLanguageCode === "en-IN" ? "anushka" : "anushka",
      }),
      signal: controller.signal,
    });
    if (!res.ok) return json({ error: "tts_unavailable" }, 502);

    const body = (await res.json()) as { audios?: string[] };
    const audioBase64 = body.audios?.[0];
    if (!audioBase64) return json({ error: "tts_unavailable" }, 502);
    return json({ audioBase64 });
  } catch {
    return json({ error: "tts_unavailable" }, 502);
  } finally {
    clearTimeout(timer);
  }
}
