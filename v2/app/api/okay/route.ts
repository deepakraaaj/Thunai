import { buildOkayPrompt } from "@/lib/prompt";
import { offlineScript } from "@/lib/offline";
import { caregiverSchema } from "@/lib/schema"; // { profile } shape
import { parseBody, json, generateOrOffline } from "@/lib/route-utils";
import type { ScriptResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = await parseBody(req, caregiverSchema);
  if (!parsed.ok) return parsed.res;

  const { profile } = parsed.data;
  const { system, user } = buildOkayPrompt(profile);
  const result = await generateOrOffline(
    system,
    user,
    offlineScript("okay", profile.language),
  );
  const body: ScriptResponse = { text: result.text, meta: result.meta };
  return json(body);
}
