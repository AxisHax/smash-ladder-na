import { describe, it, expect } from "vitest";
import { condenseByDay, currentStreak } from "@/lib/players";

function point(dateStr: string, rating: number) {
  return { date: new Date(dateStr), rating };
}

describe("condenseByDay", () => {
  it("returns an empty array for no points", () => {
    expect(condenseByDay([])).toEqual([]);
  });

  it("leaves points on different days untouched", () => {
    const points = [point("2026-01-01T10:00:00Z", 1000), point("2026-01-02T10:00:00Z", 1010)];
    expect(condenseByDay(points)).toEqual(points);
  });

  it("collapses same-day points, keeping the last one", () => {
    const points = [
      point("2026-01-01T10:00:00Z", 1000),
      point("2026-01-01T14:00:00Z", 1015),
      point("2026-01-01T20:00:00Z", 1030),
    ];
    expect(condenseByDay(points)).toEqual([point("2026-01-01T20:00:00Z", 1030)]);
  });

  it("handles a mix of collapsed and separate days in order", () => {
    const points = [
      point("2026-01-01T10:00:00Z", 1000),
      point("2026-01-01T14:00:00Z", 1015),
      point("2026-01-02T09:00:00Z", 1005),
      point("2026-01-03T09:00:00Z", 1020),
      point("2026-01-03T22:00:00Z", 1040),
    ];
    expect(condenseByDay(points)).toEqual([
      point("2026-01-01T14:00:00Z", 1015),
      point("2026-01-02T09:00:00Z", 1005),
      point("2026-01-03T22:00:00Z", 1040),
    ]);
  });
});

describe("currentStreak", () => {
  it("returns 0 for no matches", () => {
    expect(currentStreak([])).toBe(0);
  });

  it("counts a leading run of wins as positive", () => {
    expect(currentStreak([{ won: true }, { won: true }, { won: false }])).toBe(2);
  });

  it("counts a leading run of losses as negative", () => {
    expect(currentStreak([{ won: false }, { won: false }, { won: true }])).toBe(-2);
  });

  it("skips practice matches instead of counting them or breaking the streak", () => {
    expect(
      currentStreak([
        { won: true },
        { won: true, isPracticing: true },
        { won: true },
        { won: false },
      ]),
    ).toBe(2);
  });

  it("returns 0 when every match is practice", () => {
    expect(currentStreak([{ won: true, isPracticing: true }])).toBe(0);
  });
});
