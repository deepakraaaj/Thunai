import { buildSosPrompt } from "@/lib/prompt";
import { offlineScript } from "@/lib/offline";
import { sosSchema } from "@/lib/schema";
import { parseBody, json, generateOrOffline } from "@/lib/route-utils";
import type { ScriptResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = await parseBody(req, sosSchema);
  if (!parsed.ok) return parsed.res;

  const { profile, localTime } = parsed.data;
  const { system, user } = buildSosPrompt(profile, localTime ?? "");
  const result = await generateOrOffline(
    system,
    user,
    offlineScript("sos", profile.language),
  );
  const body: ScriptResponse = { text: result.text, meta: result.meta };
  return json(body);
}
