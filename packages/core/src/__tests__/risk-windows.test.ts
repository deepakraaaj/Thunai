// Tests for risk-window derivation + active-prediction logic against the seed.
import { describe, it, expect } from "vitest";
import { deriveRiskWindows, getActivePrediction, isNowInWindow } from "../risk-windows.js";
import { buildScenario, SCENARIO_IDS } from "../scenario.js";

const scenario = buildScenario();
const raviCheckins = scenario.checkins.filter((c) => c.userId === SCENARIO_IDS.RAVI_ID);

describe("deriveRiskWindows (Ravi's Friday-night pattern)", () => {
  it("surfaces a Friday evening window as the top risk", () => {
    const windows = deriveRiskWindows(raviCheckins);
    expect(windows.length).toBeGreaterThan(0);
    const top = windows[0]!;
    expect(top.dayOfWeek).toBe(5); // Friday
    expect(top.startHour).toBeGreaterThanOrEqual(18); // evening bucket
    expect(top.label.toLowerCase()).toContain("friday");
    expect(["high", "critical", "moderate"]).toContain(top.riskLevel);
  });

  it("does not invent windows from steady weekday mornings", () => {
    const windows = deriveRiskWindows(raviCheckins);
    const mondayMorning = windows.find((w) => w.dayOfWeek === 1 && w.startHour < 12);
    expect(mondayMorning).toBeUndefined();
  });

  it("confidence is within [0,1]", () => {
    for (const w of deriveRiskWindows(raviCheckins)) {
      expect(w.confidence).toBeGreaterThanOrEqual(0);
      expect(w.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe("getActivePrediction", () => {
  it("is active during Ravi's Friday-evening window", () => {
    // Friday 2026-07-24, 20:30 IST == 15:00 UTC.
    const fridayEveningUtc = new Date("2026-07-24T15:00:00.000Z");
    const p = getActivePrediction(raviCheckins, fridayEveningUtc);
    expect(p.active).toBe(true);
    expect(p.window?.dayOfWeek).toBe(5);
  });

  it("is not active on a calm Tuesday morning", () => {
    const tuesdayMorningUtc = new Date("2026-07-21T03:30:00.000Z"); // 09:00 IST
    const p = getActivePrediction(raviCheckins, tuesdayMorningUtc);
    expect(p.active).toBe(false);
  });
});

describe("isNowInWindow", () => {
  it("respects the IST day/hour boundary", () => {
    const window = { dayOfWeek: 5, startHour: 18, endHour: 21, riskLevel: "high" as const, label: "Friday evening", confidence: 0.7 };
    expect(isNowInWindow(window, new Date("2026-07-24T13:00:00.000Z"))).toBe(true); // 18:30 IST Fri
    expect(isNowInWindow(window, new Date("2026-07-24T16:00:00.000Z"))).toBe(false); // 21:30 IST Fri
  });
});
