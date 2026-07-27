import { describe, it, expect } from "vitest";
import { condenseByDay } from "@/lib/players";

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
