// Tests for deterministic mood + risk classification.
import { describe, it, expect } from "vitest";
import { classifyCheckin } from "../classify.js";

describe("classifyCheckin", () => {
  it("classifies a positive check-in as low risk", () => {
    const r = classifyCheckin("Feeling great and proud, had a good calm day.");
    expect(r.mood).toBe("positive");
    expect(r.riskLevel).toBe("low");
    expect(r.crisisFlag).toBe(false);
  });

  it("classifies craving language as distressed + high risk", () => {
    const r = classifyCheckin("The craving is strong, I really want to drink tonight.");
    expect(r.mood).toBe("distressed");
    expect(r.riskLevel).toBe("high");
  });

  it("classifies anxious language as moderate risk", () => {
    const r = classifyCheckin("I'm anxious and stressed about work, feeling nervous.");
    expect(r.mood).toBe("anxious");
    expect(r.riskLevel).toBe("moderate");
  });

  it("defaults to neutral when nothing matches", () => {
    const r = classifyCheckin("Went to the shop and bought some rice.");
    expect(r.mood).toBe("neutral");
    expect(r.riskLevel).toBe("low");
  });

  it("crisis language forces at least high risk and sets crisisFlag", () => {
    const r = classifyCheckin("I feel fine but honestly I want to die.");
    expect(r.crisisFlag).toBe(true);
    expect(["high", "critical"]).toContain(r.riskLevel);
  });

  it("acute crisis language yields critical risk", () => {
    const r = classifyCheckin("I want to kill myself.");
    expect(r.riskLevel).toBe("critical");
  });

  it("detects inflected Tamil craving (குடிக்க) as distressed + high risk", () => {
    const r = classifyCheckin("வேலை மிகவும் அழுத்தமாக இருந்தது, குடிக்க வேண்டும் போல் இருக்கிறது");
    expect(r.mood).toBe("distressed");
    expect(r.riskLevel).toBe("high");
  });

  it("detects Tamil loneliness (தனிமை) as low mood, moderate risk", () => {
    const r = classifyCheckin("இன்று தனிமையாக உணர்கிறேன்");
    expect(r.mood).toBe("low");
    expect(r.riskLevel).toBe("moderate");
  });
});
