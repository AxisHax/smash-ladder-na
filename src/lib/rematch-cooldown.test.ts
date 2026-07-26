import { describe, it, expect } from "vitest";
import { rematchCooldownAllows } from "@/lib/rematch-cooldown";

describe("rematchCooldownAllows", () => {
  it("allows it when the two have never played", () => {
    expect(rematchCooldownAllows(undefined, 24, 24)).toBe(true);
  });

  it("allows it when both sides have no cooldown set", () => {
    const justNow = new Date();
    expect(rematchCooldownAllows(justNow, null, null)).toBe(true);
  });

  it("blocks a rematch before the cooldown elapses", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    expect(rematchCooldownAllows(oneHourAgo, 12, null)).toBe(false);
  });

  it("allows a rematch once the cooldown elapses", () => {
    const thirteenHoursAgo = new Date(Date.now() - 13 * 60 * 60 * 1000);
    expect(rematchCooldownAllows(thirteenHoursAgo, 12, null)).toBe(true);
  });

  it("uses the stricter of the two sides' cooldowns", () => {
    const thirteenHoursAgo = new Date(Date.now() - 13 * 60 * 60 * 1000);
    // A is satisfied (12h), but B wants 24h — the pair isn't clear yet.
    expect(rematchCooldownAllows(thirteenHoursAgo, 12, 24)).toBe(false);
  });
});
