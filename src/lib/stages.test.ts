import { describe, it, expect } from "vitest";
import { GAME_ONE_STAGES, COUNTERPICK_STAGES } from "./stages";

describe("stage lists", () => {
  it("game 1 has exactly 5 starter stages", () => {
    expect(GAME_ONE_STAGES).toHaveLength(5);
  });

  it("counterpick list includes all starters plus counterpick stages", () => {
    for (const stage of GAME_ONE_STAGES) {
      expect(COUNTERPICK_STAGES).toContain(stage);
    }
    expect(COUNTERPICK_STAGES.length).toBeGreaterThan(GAME_ONE_STAGES.length);
  });

  it("counterpick adds Final Destination, Hollow Bastion, and Kalos Pokémon League", () => {
    expect(COUNTERPICK_STAGES).toContain("Final Destination");
    expect(COUNTERPICK_STAGES).toContain("Hollow Bastion");
    expect(COUNTERPICK_STAGES).toContain("Kalos Pokémon League");
  });

  it("no duplicate stages in either list", () => {
    expect(new Set(GAME_ONE_STAGES).size).toBe(GAME_ONE_STAGES.length);
    expect(new Set(COUNTERPICK_STAGES).size).toBe(COUNTERPICK_STAGES.length);
  });
});
