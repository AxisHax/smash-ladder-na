import { describe, it, expect } from "vitest";
import { expandRegionForSearch, getRegionsWithinDistance, MATCH_REGIONS, MATCH_REGION_GROUPS } from "./regions";

describe("getRegionsWithinDistance", () => {
  it("returns empty array for null region", () => {
    expect(getRegionsWithinDistance(null, 5000)).toEqual([]);
  });

  it("returns only the region itself for unknown regions like 'Other'", () => {
    expect(getRegionsWithinDistance("Other", 5000)).toEqual(["Other"]);
  });

  it("always includes the region itself", () => {
    expect(getRegionsWithinDistance("USA East", 0)).toContain("USA East");
  });

  it("returns only regions sharing the exact same point at distance 0", () => {
    // "Washington D.C." shares USA East's coordinates on purpose (same
    // physical point, more specific name) — see regions.ts.
    const result = getRegionsWithinDistance("USA East", 0);
    expect(result).toEqual(["USA East", "Washington D.C."]);
  });

  it("includes nearby regions within range", () => {
    const result = getRegionsWithinDistance("USA East", 2000);
    expect(result).toContain("USA East");
    expect(result).toContain("Canada East");
  });

  it("excludes distant regions from a tight radius", () => {
    const result = getRegionsWithinDistance("USA East", 2000);
    expect(result).not.toContain("East Asia");
    expect(result).not.toContain("Oceania");
  });

  it("returns all regions for null (worldwide) distance", () => {
    const result = getRegionsWithinDistance("USA East", null);
    expect(result).toEqual([...MATCH_REGIONS]);
  });

  it("USA Pacific and USA East are far enough apart to be excluded at 2000km", () => {
    const result = getRegionsWithinDistance("USA East", 2000);
    expect(result).not.toContain("USA Pacific");
  });

  it("continental distance covers all of NA", () => {
    const result = getRegionsWithinDistance("USA East", 10000);
    expect(result).toContain("USA Pacific");
    expect(result).toContain("Canada Pacific");
    expect(result).toContain("Mexico Central");
  });

  // Regression coverage for the state/province-level regions added
  // alongside the original eight broad USA/Canada regions — a player who
  // already has one of the old broad regions set must keep matching
  // players who pick the new granular equivalent, and vice versa.
  it("an old broad region and its new state/province equivalent are mutual matches at distance 0", () => {
    const pairs: [string, string][] = [
      ["USA East", "Washington D.C."],
      ["USA Central", "Illinois"],
      ["USA Mountain", "Colorado"],
      ["USA Pacific", "California"],
      ["Canada East", "Ontario"],
      ["Canada Central", "Manitoba"],
      ["Canada Mountain", "Alberta"],
      ["Canada Pacific", "British Columbia"],
    ];
    for (const [broad, granular] of pairs) {
      expect(getRegionsWithinDistance(broad, 0)).toContain(granular);
      expect(getRegionsWithinDistance(granular, 0)).toContain(broad);
    }
  });
});

describe("expandRegionForSearch", () => {
  it("expands a broad USA region to itself plus its states", () => {
    const result = expandRegionForSearch("USA East");
    expect(result).toContain("USA East");
    expect(result).toContain("New York");
    expect(result).toContain("Florida");
    expect(result).not.toContain("California");
  });

  it("expands a broad Canada region to itself plus its provinces", () => {
    const result = expandRegionForSearch("Canada Pacific");
    expect(result).toContain("Canada Pacific");
    expect(result).toContain("British Columbia");
    expect(result).not.toContain("Ontario");
  });

  it("returns just itself for a specific state (no further expansion)", () => {
    expect(expandRegionForSearch("Texas")).toEqual(["Texas"]);
  });

  it("returns just itself for a region with no broad/granular split", () => {
    expect(expandRegionForSearch("Other")).toEqual(["Other"]);
  });

  it("every state/province used in the expansion is a real MATCH_REGIONS entry", () => {
    for (const region of MATCH_REGIONS) {
      for (const expanded of expandRegionForSearch(region)) {
        expect(MATCH_REGIONS as readonly string[]).toContain(expanded);
      }
    }
  });
});

describe("MATCH_REGION_GROUPS", () => {
  it("covers every region in MATCH_REGIONS exactly once", () => {
    const grouped = MATCH_REGION_GROUPS.flatMap((g) => g.regions);
    expect(grouped.length).toBe(MATCH_REGIONS.length);
    expect(new Set(grouped).size).toBe(MATCH_REGIONS.length);
    expect(new Set(grouped)).toEqual(new Set(MATCH_REGIONS));
  });
});
