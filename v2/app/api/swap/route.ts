import { buildSwapPrompt } from "@/lib/prompt";
import { offlineScript } from "@/lib/offline";
import { swapSchema } from "@/lib/schema";
import { parseBody, json, generateOrOffline } from "@/lib/route-utils";
import type { SwapResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const parsed = await parseBody(req, swapSchema);
  if (!parsed.ok) return parsed.res;

  const { profile } = parsed.data;
  const { system, user } = buildSwapPrompt(profile);
  const result = await generateOrOffline(
    system,
    user,
    offlineScript("swap", profile.language),
  );
  const body: SwapResponse = { text: result.text, meta: result.meta };
  return json(body);
}
