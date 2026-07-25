// =============================================================================
// schema.ts — zod validation for every API route. Chip/enum values are checked
// against strict allowlists; free-text (name, transcript) is length-bounded and
// sanitized downstream in prompt.ts. Oversized/invalid bodies are rejected.
// =============================================================================

import { z } from "zod";

export const languageSchema = z.enum(["ta", "en", "mix"]);
export const substanceSchema = z.enum(["Alcohol", "Tobacco", "Drugs", "Something else"]);
export const stageSchema = z.enum(["just-starting", "few-weeks", "few-months", "six-plus"]);
export const triggerSchema = z.enum([
  "Work stress",
  "Loneliness",
  "Evenings",
  "Friends who use",
  "Family tension",
]);
export const doingItForSchema = z.enum(["Myself", "My child", "Partner", "Parents"]);
export const desireSchema = z.enum(["Good food", "A gadget", "For my child", "Saving up"]);

export const profileSchema = z.object({
  name: z.string().min(1).max(40),
  substance: substanceSchema,
  stage: stageSchema,
  startDays: z.number().int().min(0).max(100000),
  createdAt: z.number().int().nonnegative(),
  trigger: triggerSchema,
  doingItFor: doingItForSchema,
  lovedOneName: z.string().max(40).optional(),
  dailySpend: z.number().min(0).max(100000),
  desire: desireSchema,
  language: languageSchema,
  isSample: z.boolean().optional(),
});

export const sosSchema = z.object({
  profile: profileSchema,
  localTime: z.string().max(40).optional(),
});

export const caregiverSchema = z.object({ profile: profileSchema });
export const slipSchema = z.object({ profile: profileSchema });
export const swapSchema = z.object({ profile: profileSchema });

export const checkinSchema = z.object({
  profile: profileSchema,
  transcript: z.string().max(600),
});

export const ttsSchema = z.object({
  text: z.string().min(1).max(1200),
  targetLanguageCode: z.enum(["ta-IN", "en-IN"]),
});

export const eventSchema = z.object({
  type: z.enum(["sos", "checkin", "slip", "swap", "okay"]),
  user_name: z.string().min(1).max(40),
  payload: z.record(z.unknown()).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
