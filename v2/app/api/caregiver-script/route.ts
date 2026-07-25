import { buildCaregiverPrompt } from "@/lib/prompt";
import { offlineScript } from "@/lib/offline";
import { caregiverSchema } from "@/lib/schema";
import { parseBody, json, generateOrOffline } from "@/lib/route-utils";
import type { ScriptResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = await parseBody(req, caregiverSchema);
  if (!parsed.ok) return parsed.res;

  const { profile } = parsed.data;
  const { system, user } = buildCaregiverPrompt(profile);
  // Caregiver coaching is always in English; offline uses the caregiver script.
  const result = await generateOrOffline(system, user, offlineScript("caregiver", "en"));
  const body: ScriptResponse = { text: result.text, meta: result.meta };
  return json(body);
}
