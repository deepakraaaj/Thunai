// Tests for persona-aware prompt assembly + voice-rule enforcement.
import { describe, it, expect } from "vitest";
import {
  buildSosPrompt,
  buildCaregiverPrompt,
  buildSlipPrompt,
  buildInsightsPrompt,
  parseSlipOutput,
} from "../prompts.js";
import type { UserProfile } from "@anchor/contracts";

const ravi: UserProfile = {
  userId: "user-ravi",
  name: "Ravi",
  persona: "individual",
  substance: "alcohol",
  daysSober: 90,
  stage: "established",
  trigger: "work stress",
  motivation: "his daughter Ananya",
  language: "ta",
  dailyCostInr: 525,
  createdAt: "2026-04-01T00:00:00.000Z",
};

describe("prompt assembly", () => {
  it("embeds Ravi's persona context and forces Tamil output", () => {
    const p = buildSosPrompt(ravi);
    expect(p.system).toContain("Tamil");
    expect(p.prompt).toContain("Ravi");
    expect(p.prompt).toContain("work stress");
    expect(p.prompt).toContain("Ananya");
  });

  it("enforces the non-clinical, one-action voice rules", () => {
    const p = buildSosPrompt(ravi);
    expect(p.system).toMatch(/never call the person an addict/i);
    expect(p.system).toMatch(/clinical/i);
    expect(p.system).toMatch(/ONE small/i);
  });

  it("reports the exact contextFields used (for AiMeta transparency)", () => {
    const p = buildSosPrompt(ravi);
    expect(p.contextFields).toEqual(
      expect.arrayContaining([
        "name",
        "substance",
        "stage",
        "trigger",
        "motivation",
        "language",
        "timeOfDay",
      ]),
    );
  });

  it("caregiver prompt uses the caregiver's language, not the user's", () => {
    const p = buildCaregiverPrompt(ravi, "en");
    expect(p.system).toContain("English");
    expect(p.contextFields).toContain("caregiverLanguage");
  });

  it("slip prompt asks for RESPONSE + WHATSAPP sections", () => {
    const p = buildSlipPrompt(ravi);
    expect(p.prompt).toContain("RESPONSE:");
    expect(p.prompt).toContain("WHATSAPP:");
  });

  it("insights prompt includes the pattern summary", () => {
    const p = buildInsightsPrompt(ravi, "Hardest window is Friday evening.");
    expect(p.prompt).toContain("Friday evening");
    expect(p.contextFields).toContain("patternSummary");
  });
});

describe("parseSlipOutput", () => {
  it("splits labeled output into script + whatsappDraft", () => {
    const raw = "RESPONSE: You are not starting over.\nWHATSAPP: Hey, can you call me?";
    const { script, whatsappDraft } = parseSlipOutput(raw);
    expect(script).toBe("You are not starting over.");
    expect(whatsappDraft).toBe("Hey, can you call me?");
  });

  it("falls back gracefully when labels are missing", () => {
    const { script, whatsappDraft } = parseSlipOutput("just some compassionate text");
    expect(script).toContain("compassionate");
    expect(whatsappDraft.length).toBeGreaterThan(0);
  });
});
