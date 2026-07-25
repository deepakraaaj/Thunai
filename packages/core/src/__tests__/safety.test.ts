// Tests for the crisis-detection safety layer (deterministic escalation).
import { describe, it, expect } from "vitest";
import { detectCrisisLanguage, TELE_MANAS } from "../safety.js";

describe("detectCrisisLanguage", () => {
  it("does not flag ordinary hard days", () => {
    const r = detectCrisisLanguage("Work was stressful and I felt like a drink.");
    expect(r.flagged).toBe(false);
    expect(r.escalation).toBeUndefined();
  });

  it("flags explicit suicidal intent as acute with Tele-MANAS 14416", () => {
    const r = detectCrisisLanguage("I don't want to be here anymore, I want to die.");
    expect(r.flagged).toBe(true);
    expect(r.escalation?.severity).toBe("acute");
    expect(r.escalation?.matchedCategory).toBe("suicidal-intent");
    expect(r.escalation?.helplineName).toBe(TELE_MANAS.name);
    expect(r.escalation?.helplineNumber).toBe("14416");
  });

  it("flags self-harm language as acute", () => {
    const r = detectCrisisLanguage("Sometimes I just want to hurt myself.");
    expect(r.escalation?.severity).toBe("acute");
    expect(r.escalation?.matchedCategory).toBe("self-harm");
  });

  it("flags hopelessness as elevated (not acute)", () => {
    const r = detectCrisisLanguage("There's no way out of this, I feel hopeless.");
    expect(r.flagged).toBe(true);
    expect(r.escalation?.severity).toBe("elevated");
  });

  it("prefers acute over elevated when both appear", () => {
    const r = detectCrisisLanguage("I feel hopeless and I want to end my life.");
    expect(r.escalation?.severity).toBe("acute");
  });

  it("detects Tamil suicidal-intent phrasing", () => {
    const r = detectCrisisLanguage("எனக்கு தற்கொலை எண்ணம் வருகிறது");
    expect(r.flagged).toBe(true);
    expect(r.escalation?.severity).toBe("acute");
  });

  it("is punctuation/case insensitive", () => {
    const r = detectCrisisLanguage("KILL MYSELF!!!");
    expect(r.flagged).toBe(true);
  });

  it("returns not-flagged on empty input", () => {
    expect(detectCrisisLanguage("   ").flagged).toBe(false);
  });
});
