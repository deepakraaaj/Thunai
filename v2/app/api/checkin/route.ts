import { buildCheckinPrompt } from "@/lib/prompt";
import { offlineScript } from "@/lib/offline";
import { checkinSchema } from "@/lib/schema";
import { parseBody, json, generateOrOffline } from "@/lib/route-utils";
import type { CheckinResponse } from "@/lib/types";

export const runtime = "nodejs";

/** Parse the model's first-line JSON {mood, riskLevel}; the rest is reflection. */
function splitCheckin(raw: string): {
  mood: string;
  riskLevel: "low" | "medium" | "high";
  reflection: string;
} {
  const lines = raw.split("\n");
  let mood = "okay";
  let riskLevel: "low" | "medium" | "high" = "low";
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const match = line.match(/\{[\s\S]*?\}/);
    if (match) {
      try {
        const obj = JSON.parse(match[0]) as { mood?: string; riskLevel?: string };
        if (typeof obj.mood === "string" && obj.mood.trim()) mood = obj.mood.trim().slice(0, 24);
        if (obj.riskLevel === "high" || obj.riskLevel === "medium" || obj.riskLevel === "low") {
          riskLevel = obj.riskLevel;
        }
        bodyStart = i + 1;
      } catch {
        // not JSON — treat whole thing as reflection
      }
    }
    break;
  }

  const reflection = lines.slice(bodyStart).join("\n").trim() || raw.trim();
  return { mood, riskLevel, reflection };
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, checkinSchema);
  if (!parsed.ok) return parsed.res;

  const { profile, transcript } = parsed.data;
  const { system, user } = buildCheckinPrompt(profile, transcript);
  const result = await generateOrOffline(
    system,
    user,
    offlineScript("checkin", profile.language),
  );

  const parsedOut = result.meta.isOfflineFallback
    ? { mood: "here", riskLevel: "low" as const, reflection: result.text }
    : splitCheckin(result.text);

  const body: CheckinResponse = { ...parsedOut, meta: result.meta };
  return json(body);
}
