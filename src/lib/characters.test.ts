import { describe, it, expect } from "vitest";
import { ECHO_FIGHTER_GROUPS, echoGroupCanonical, echoGroupLabel, echoGroupMembers } from "./characters";

describe("echoGroupMembers", () => {
  it("returns both sides of an echo pair, regardless of which one you start from", () => {
    expect(echoGroupMembers("Peach")).toEqual(["Peach", "Daisy"]);
    expect(echoGroupMembers("Daisy")).toEqual(["Peach", "Daisy"]);
  });

  it("returns just the character itself for anyone without an echo", () => {
    expect(echoGroupMembers("Fox")).toEqual(["Fox"]);
  });

  it("keeps Marth/Lucina and Roy/Chrom ungrouped despite being official echoes", () => {
    expect(echoGroupMembers("Marth")).toEqual(["Marth"]);
    expect(echoGroupMembers("Lucina")).toEqual(["Lucina"]);
    expect(echoGroupMembers("Roy")).toEqual(["Roy"]);
    expect(echoGroupMembers("Chrom")).toEqual(["Chrom"]);
  });
});

describe("echoGroupCanonical", () => {
  it("resolves every member of a group to the same canonical character", () => {
    expect(echoGroupCanonical("Peach")).toBe("Peach");
    expect(echoGroupCanonical("Daisy")).toBe("Peach");
  });

  it("is just the character itself for anyone without an echo", () => {
    expect(echoGroupCanonical("Fox")).toBe("Fox");
  });
});

describe("echoGroupLabel", () => {
  it("joins an echo pair into one combined label", () => {
    expect(echoGroupLabel("Peach")).toBe("Peach / Daisy");
    expect(echoGroupLabel("Daisy")).toBe("Peach / Daisy");
  });

  it("is just the plain name for anyone without an echo", () => {
    expect(echoGroupLabel("Kirby")).toBe("Kirby");
  });
});

describe("ECHO_FIGHTER_GROUPS", () => {
  it("has no character appearing in more than one group", () => {
    const seen = new Set<string>();
    for (const group of ECHO_FIGHTER_GROUPS) {
      for (const member of group) {
        expect(seen.has(member)).toBe(false);
        seen.add(member);
      }
    }
  });
});
