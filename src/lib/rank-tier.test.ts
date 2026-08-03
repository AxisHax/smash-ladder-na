import { describe, it, expect } from "vitest";
import { getRankTier, didTierUp } from "./rank-tier";

describe("getRankTier", () => {
  it("returns null for provisional players (< 10 games)", () => {
    expect(getRankTier(2000, 9)).toBeNull();
    expect(getRankTier(1500, 0)).toBeNull();
  });

  it("returns Legend at 2100+", () => {
    expect(getRankTier(2100, 10)?.name).toBe("Legend");
    expect(getRankTier(2500, 50)?.name).toBe("Legend");
  });

  it("returns Grandmaster at 1900–2099", () => {
    expect(getRankTier(1900, 10)?.name).toBe("Grandmaster");
    expect(getRankTier(2099, 50)?.name).toBe("Grandmaster");
  });

  it("returns Master at 1750–1899", () => {
    expect(getRankTier(1750, 10)?.name).toBe("Master");
    expect(getRankTier(1899, 10)?.name).toBe("Master");
  });

  it("returns Elite at 1600–1749", () => {
    expect(getRankTier(1600, 10)?.name).toBe("Elite");
  });

  it("returns Fighter at 1450–1599", () => {
    expect(getRankTier(1500, 10)?.name).toBe("Fighter");
  });

  it("returns Challenger below 1450", () => {
    expect(getRankTier(1449, 10)?.name).toBe("Challenger");
    expect(getRankTier(0, 10)?.name).toBe("Challenger");
    expect(getRankTier(-100, 10)?.name).toBe("Challenger");
  });

  it("returns Challenger at exact boundary of 1450", () => {
    expect(getRankTier(1450, 10)?.name).toBe("Fighter");
    expect(getRankTier(1449, 10)?.name).toBe("Challenger");
  });
});

describe("didTierUp", () => {
  it("returns true when crossing into a higher tier", () => {
    expect(didTierUp(1740, 1760, 20)).toBe(true); // Elite -> Master
    expect(didTierUp(1890, 1910, 20)).toBe(true); // Master -> Grandmaster
    expect(didTierUp(2090, 2110, 20)).toBe(true); // Grandmaster -> Legend
  });

  it("returns false when staying in the same tier", () => {
    expect(didTierUp(1500, 1550, 20)).toBe(false);
  });

  it("returns false when dropping a tier", () => {
    expect(didTierUp(1760, 1740, 20)).toBe(false);
  });

  it("returns false for provisional players", () => {
    expect(didTierUp(1740, 1760, 5)).toBe(false);
  });
});
