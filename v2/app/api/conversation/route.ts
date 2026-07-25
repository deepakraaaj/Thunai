import { buildConversationPrompt } from "@/lib/prompt";
import { offlineScript } from "@/lib/offline";
import { conversationSchema } from "@/lib/schema";
import { generateOrOffline, json, parseBody } from "@/lib/route-utils";
import type { ScriptResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = await parseBody(req, conversationSchema);
  if (!parsed.ok) return parsed.res;

  const { profile, history, message } = parsed.data;
  const prompt = buildConversationPrompt(profile, history, message);
  const result = await generateOrOffline(
    prompt.system,
    prompt.user,
    offlineScript("sos", profile.language),
  );
  const body: ScriptResponse = { text: result.text, meta: result.meta };
  return json(body);
}
