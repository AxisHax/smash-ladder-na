import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import {
  getCharacterLeaderboard,
  recomputeCharacterUsage,
  setOwnCharacters,
} from "@/lib/character-stats";
import { MatchStatus } from "@/generated/prisma/enums";
import { createTestUser } from "@/test/factories";

async function createConfirmedMatch(p1: string, p2: string) {
  return prisma.ratingMatch.create({
    data: { player1Id: p1, player2Id: p2, status: MatchStatus.CONFIRMED, expiresAt: new Date() },
  });
}

async function createGame(
  matchId: string,
  gameNumber: number,
  actorAId: string,
  actorACharacter: string | null,
  actorBId: string,
  actorBCharacter: string | null,
  winnerId: string | null,
) {
  return prisma.matchGame.create({
    data: { matchId, gameNumber, actorAId, actorAStrikes: 1, actorACharacter, actorBId, actorBStrikes: 2, actorBCharacter, winnerId },
  });
}

describe("setOwnCharacters", () => {
  it("sets mainCharacter, secondaries, and the self-declared flag", async () => {
    const player = await createTestUser({ mainCharacter: "Pikachu" }); // pre-existing auto-computed value

    await setOwnCharacters(player.id, "Inkling", ["Cloud", "Roy"]);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.mainCharacter).toBe("Inkling");
    expect(updated.secondaryCharacters).toEqual(["Cloud", "Roy"]);
    expect(updated.charactersSelfDeclared).toBe(true);
  });

  it("allows clearing mainCharacter back to null", async () => {
    const player = await createTestUser({ mainCharacter: "Fox" });

    await setOwnCharacters(player.id, null, []);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.mainCharacter).toBeNull();
  });

  it("dedupes repeated secondary characters", async () => {
    const player = await createTestUser();

    await setOwnCharacters(player.id, "Fox", ["Falco", "Falco"]);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.secondaryCharacters).toEqual(["Falco"]);
  });

  it("rejects the same character as both main and secondary", async () => {
    const player = await createTestUser();
    await expect(setOwnCharacters(player.id, "Fox", ["Fox"])).rejects.toThrow(/both your main and a secondary/i);
  });

  it("rejects more secondaries than the cap", async () => {
    const player = await createTestUser();
    await expect(
      setOwnCharacters(player.id, "Fox", ["Falco", "Marth", "Cloud", "Roy", "Ike", "Pikachu"]),
    ).rejects.toThrow(/at most 5/i);
  });

  it("rejects an unrecognized character", async () => {
    const player = await createTestUser();
    await expect(setOwnCharacters(player.id, "Not A Real Fighter", [])).rejects.toThrow(
      /not a recognized character/i,
    );
  });
});

describe("recomputeCharacterUsage", () => {
  it("sets mainCharacter to whichever character was actually played the most", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Fox", opponent.id, "Marth", player.id);
    await createGame(match.id, 2, player.id, "Fox", opponent.id, "Marth", opponent.id);
    await createGame(match.id, 3, player.id, "Falco", opponent.id, "Marth", player.id);

    await prisma.$transaction((tx) => recomputeCharacterUsage(player.id, tx));

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.mainCharacter).toBe("Fox");
    expect(updated.secondaryCharacters).toEqual(["Falco"]);
  });

  it("promotes a newly-dominant character over a stale main", async () => {
    const player = await createTestUser({ mainCharacter: "Fox", secondaryCharacters: [] });
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Fox", opponent.id, "Marth", player.id);
    await createGame(match.id, 2, player.id, "Falco", opponent.id, "Marth", player.id);
    await createGame(match.id, 3, player.id, "Falco", opponent.id, "Marth", player.id);
    await createGame(match.id, 4, player.id, "Falco", opponent.id, "Marth", opponent.id);

    await prisma.$transaction((tx) => recomputeCharacterUsage(player.id, tx));

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.mainCharacter).toBe("Falco");
    expect(updated.secondaryCharacters).toEqual(["Fox"]);
  });

  it("does nothing once the player has self-declared their characters", async () => {
    const player = await createTestUser({
      mainCharacter: "Pikachu",
      secondaryCharacters: ["Fox"],
      charactersSelfDeclared: true,
    });
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Falco", opponent.id, "Marth", player.id);
    await createGame(match.id, 2, player.id, "Falco", opponent.id, "Marth", player.id);

    await prisma.$transaction((tx) => recomputeCharacterUsage(player.id, tx));

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.mainCharacter).toBe("Pikachu");
    expect(updated.secondaryCharacters).toEqual(["Fox"]);
  });

  it("clears mainCharacter to null when there's no qualifying game history", async () => {
    const player = await createTestUser({ mainCharacter: "Fox" });

    await prisma.$transaction((tx) => recomputeCharacterUsage(player.id, tx));

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.mainCharacter).toBeNull();
    expect(updated.secondaryCharacters).toEqual([]);
  });

  it("excludes a secondary at exactly the usage threshold (must exceed, not just reach, 10%)", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    // 9 Fox games + 1 Falco game = 10 total — Falco lands at exactly 10%.
    for (let i = 1; i <= 9; i++) {
      await createGame(match.id, i, player.id, "Fox", opponent.id, "Marth", player.id);
    }
    await createGame(match.id, 10, player.id, "Falco", opponent.id, "Marth", player.id);

    await prisma.$transaction((tx) => recomputeCharacterUsage(player.id, tx));

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.mainCharacter).toBe("Fox");
    expect(updated.secondaryCharacters).toEqual([]);
  });

  it("includes a secondary once it clears the usage threshold", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    // 8 Fox games + 2 Falco games = 10 total — Falco lands at 20%.
    for (let i = 1; i <= 8; i++) {
      await createGame(match.id, i, player.id, "Fox", opponent.id, "Marth", player.id);
    }
    await createGame(match.id, 9, player.id, "Falco", opponent.id, "Marth", player.id);
    await createGame(match.id, 10, player.id, "Falco", opponent.id, "Marth", player.id);

    await prisma.$transaction((tx) => recomputeCharacterUsage(player.id, tx));

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: player.id } });
    expect(updated.mainCharacter).toBe("Fox");
    expect(updated.secondaryCharacters).toEqual(["Falco"]);
  });
});

describe("getCharacterLeaderboard", () => {
  it("includes a player whose mainCharacter matches", async () => {
    const player = await createTestUser({ mainCharacter: "Fox", gamesPlayed: 10 });
    const results = await getCharacterLeaderboard("Fox");
    expect(results.map((p) => p.id)).toContain(player.id);
  });

  it("includes a player whose secondaryCharacters matches, not just mainCharacter", async () => {
    const player = await createTestUser({ mainCharacter: "Fox", secondaryCharacters: ["Falco"], gamesPlayed: 10 });
    const results = await getCharacterLeaderboard("Falco");
    expect(results.map((p) => p.id)).toContain(player.id);
  });

  it("excludes players below the games-played threshold", async () => {
    const player = await createTestUser({ mainCharacter: "Fox", gamesPlayed: 0 });
    const results = await getCharacterLeaderboard("Fox");
    expect(results.map((p) => p.id)).not.toContain(player.id);
  });
});
