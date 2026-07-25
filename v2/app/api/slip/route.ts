import { buildSlipPrompt } from "@/lib/prompt";
import { offlineScript } from "@/lib/offline";
import { slipSchema } from "@/lib/schema";
import { parseBody, json, generateOrOffline } from "@/lib/route-utils";
import type { SlipResponse } from "@/lib/types";

export const runtime = "nodejs";

function splitSlip(raw: string): { text: string; whatsappDraft: string } {
  const resp = raw.match(/RESPONSE:\s*([\s\S]*?)(?:WHATSAPP:|$)/i);
  const wa = raw.match(/WHATSAPP:\s*([\s\S]*)$/i);
  const text = resp?.[1]?.trim() || raw.trim();
  const whatsappDraft =
    wa?.[1]?.trim() ||
    "Hey — I'm having a rough moment and could use a little company. Can we talk?";
  return { text, whatsappDraft };
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, slipSchema);
  if (!parsed.ok) return parsed.res;

  const { profile } = parsed.data;
  const { system, user } = buildSlipPrompt(profile);
  const result = await generateOrOffline(
    system,
    user,
    offlineScript("slip", profile.language),
  );

  const split = result.meta.isOfflineFallback
    ? {
        text: result.text,
        whatsappDraft:
          "Hey — I'm having a rough moment and could use a little company. Can we talk?",
      }
    : splitSlip(result.text);

  const body: SlipResponse = { ...split, meta: result.meta };
  return json(body);
}
