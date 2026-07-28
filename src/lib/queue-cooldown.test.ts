import { describe, it, expect } from "vitest";
import { nextTimeoutCooldown, TIMEOUT_COOLDOWN_STEP_MS, TIMEOUT_COOLDOWN_RESET_WINDOW_MS } from "./queue-cooldown";

const NOW = new Date("2026-01-15T00:00:00Z");

describe("nextTimeoutCooldown", () => {
  it("starts at 1 (5 min) for a first-ever timeout", () => {
    const result = nextTimeoutCooldown({ recentTimeoutCount: 0, lastTimeoutAt: null }, NOW);
    expect(result.recentTimeoutCount).toBe(1);
    expect(result.cooldownUntil.getTime()).toBe(NOW.getTime() + TIMEOUT_COOLDOWN_STEP_MS);
  });

  it("escalates when the previous timeout was recent", () => {
    const recentlyTimedOut = new Date(NOW.getTime() - 60 * 60 * 1000); // 1 hour ago
    const result = nextTimeoutCooldown({ recentTimeoutCount: 2, lastTimeoutAt: recentlyTimedOut }, NOW);
    expect(result.recentTimeoutCount).toBe(3);
    expect(result.cooldownUntil.getTime()).toBe(NOW.getTime() + 3 * TIMEOUT_COOLDOWN_STEP_MS);
  });

  it("resets the streak once the reset window has elapsed", () => {
    const longAgo = new Date(NOW.getTime() - TIMEOUT_COOLDOWN_RESET_WINDOW_MS - 1);
    const result = nextTimeoutCooldown({ recentTimeoutCount: 5, lastTimeoutAt: longAgo }, NOW);
    expect(result.recentTimeoutCount).toBe(1);
    expect(result.cooldownUntil.getTime()).toBe(NOW.getTime() + TIMEOUT_COOLDOWN_STEP_MS);
  });

  it("still escalates right at the edge of the reset window", () => {
    const justInsideWindow = new Date(NOW.getTime() - TIMEOUT_COOLDOWN_RESET_WINDOW_MS + 1000);
    const result = nextTimeoutCooldown({ recentTimeoutCount: 1, lastTimeoutAt: justInsideWindow }, NOW);
    expect(result.recentTimeoutCount).toBe(2);
  });
});
