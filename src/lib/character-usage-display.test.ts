import { describe, it, expect } from "vitest";
import { groupCharacterUsageForDisplay } from "./character-usage-display";
import type { CharacterUsage } from "./players";

function usage(character: string, games: number): CharacterUsage {
  return { character, games, wins: 0, losses: games, winRate: 0, usagePercent: 0 };
}

describe("groupCharacterUsageForDisplay", () => {
  it("returns no main and empty lists for an empty usage array", () => {
    const result = groupCharacterUsageForDisplay([]);
    expect(result).toEqual({ main: null, secondary: [], overflow: [] });
  });

  it("puts the single entry in main with nothing else", () => {
    const result = groupCharacterUsageForDisplay([usage("Fox", 10)]);
    expect(result.main?.character).toBe("Fox");
    expect(result.secondary).toEqual([]);
    expect(result.overflow).toEqual([]);
  });

  it("splits 2-4 entries into main plus secondary, with no overflow", () => {
    const input = [usage("Fox", 10), usage("Falco", 8), usage("Marth", 5), usage("Cloud", 3)];
    const result = groupCharacterUsageForDisplay(input);
    expect(result.main?.character).toBe("Fox");
    expect(result.secondary.map((u) => u.character)).toEqual(["Falco", "Marth", "Cloud"]);
    expect(result.overflow).toEqual([]);
  });

  it("caps secondary at 3 and moves the rest to overflow, preserving rank order", () => {
    const input = [
      usage("Fox", 20),
      usage("Falco", 10),
      usage("Marth", 8),
      usage("Cloud", 6),
      usage("Terry", 4),
      usage("Ken", 2),
    ];
    const result = groupCharacterUsageForDisplay(input);
    expect(result.main?.character).toBe("Fox");
    expect(result.secondary.map((u) => u.character)).toEqual(["Falco", "Marth", "Cloud"]);
    expect(result.overflow.map((u) => u.character)).toEqual(["Terry", "Ken"]);
  });
});
