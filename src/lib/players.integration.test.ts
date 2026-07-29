import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import {
  getCareerStats,
  getCharacterUsage,
  getPlayerMatchHistory,
  getTopCharacters,
  isCurrentlyInMatch,
} from "@/lib/players";
import { MatchStatus } from "@/generated/prisma/enums";
import { createTestUser } from "@/test/factories";

async function createConfirmedMatch(
  p1: string,
  p2: string,
  options: { reportedWinnerId?: string; player1IsPracticing?: boolean; player2IsPracticing?: boolean } = {},
) {
  return prisma.ratingMatch.create({
    data: {
      player1Id: p1,
      player2Id: p2,
      status: MatchStatus.CONFIRMED,
      expiresAt: new Date(),
      reportedWinnerId: options.reportedWinnerId,
      player1IsPracticing: options.player1IsPracticing ?? false,
      player2IsPracticing: options.player2IsPracticing ?? false,
    },
  });
}

async function createPendingMatch(p1: string, p2: string) {
  return prisma.ratingMatch.create({
    data: {
      player1Id: p1,
      player2Id: p2,
      status: MatchStatus.PENDING_REPORT,
      expiresAt: new Date(),
    },
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
    data: {
      matchId,
      gameNumber,
      actorAId,
      actorAStrikes: 1,
      actorACharacter,
      actorBId,
      actorBStrikes: 2,
      actorBCharacter,
      winnerId,
    },
  });
}

describe("isCurrentlyInMatch", () => {
  it("is true while a match is pending report", async () => {
    const p1 = await createTestUser();
    const p2 = await createTestUser();
    await createPendingMatch(p1.id, p2.id);

    expect(await isCurrentlyInMatch(p1.id)).toBe(true);
    expect(await isCurrentlyInMatch(p2.id)).toBe(true);
  });

  it("is false once the match is confirmed", async () => {
    const p1 = await createTestUser();
    const p2 = await createTestUser();
    await createConfirmedMatch(p1.id, p2.id);

    expect(await isCurrentlyInMatch(p1.id)).toBe(false);
  });

  it("is false for a player with no matches at all", async () => {
    const player = await createTestUser();
    expect(await isCurrentlyInMatch(player.id)).toBe(false);
  });
});

describe("getTopCharacters", () => {
  it("returns an empty array when the player has no qualifying games", async () => {
    const player = await createTestUser();
    expect(await getTopCharacters(player.id)).toEqual([]);
  });

  it("returns a single character when only one was played", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);

    expect(await getTopCharacters(player.id)).toEqual(["Terry"]);
  });

  it("ranks characters by descending game count", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);
    await createGame(match.id, 2, player.id, "Terry", opponent.id, "Ken", player.id);
    await createGame(match.id, 3, player.id, "Cloud", opponent.id, "Ken", player.id);

    expect(await getTopCharacters(player.id)).toEqual(["Terry", "Cloud"]);
  });

  it("breaks ties alphabetically", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Cloud", opponent.id, "Ken", player.id);
    await createGame(match.id, 2, player.id, "Bowser", opponent.id, "Ken", player.id);

    expect(await getTopCharacters(player.id)).toEqual(["Bowser", "Cloud"]);
  });

  it("excludes games from matches that aren't confirmed", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createPendingMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);

    expect(await getTopCharacters(player.id)).toEqual([]);
  });

  it("excludes games with no winner (disputed/void)", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", null);

    expect(await getTopCharacters(player.id)).toEqual([]);
  });

  it("respects the limit parameter", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);
    await createGame(match.id, 2, player.id, "Cloud", opponent.id, "Ken", player.id);
    await createGame(match.id, 3, player.id, "Bowser", opponent.id, "Ken", player.id);

    expect(await getTopCharacters(player.id, 2)).toHaveLength(2);
  });

  it("uses actorBCharacter when the player is recorded on the B side", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(opponent.id, player.id);
    await createGame(match.id, 1, opponent.id, "Ken", player.id, "Terry", player.id);

    expect(await getTopCharacters(player.id)).toEqual(["Terry"]);
  });
});

describe("getCharacterUsage", () => {
  it("returns an empty array when the player has no qualifying games", async () => {
    const player = await createTestUser();
    expect(await getCharacterUsage(player.id)).toEqual([]);
  });

  it("computes games, wins, losses, win rate, and usage percent per character", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    // Terry: 2 games, 1 win. Cloud: 2 games, 2 wins. Total: 4 games.
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);
    await createGame(match.id, 2, player.id, "Terry", opponent.id, "Ken", opponent.id);
    await createGame(match.id, 3, player.id, "Cloud", opponent.id, "Ken", player.id);
    await createGame(match.id, 4, player.id, "Cloud", opponent.id, "Ken", player.id);

    expect(await getCharacterUsage(player.id)).toEqual([
      { character: "Cloud", games: 2, wins: 2, losses: 0, winRate: 100, usagePercent: 50 },
      { character: "Terry", games: 2, wins: 1, losses: 1, winRate: 50, usagePercent: 50 },
    ]);
  });

  it("orders by games played descending, ties broken alphabetically", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);
    await createGame(match.id, 2, player.id, "Terry", opponent.id, "Ken", player.id);
    await createGame(match.id, 3, player.id, "Cloud", opponent.id, "Ken", player.id);
    await createGame(match.id, 4, player.id, "Bowser", opponent.id, "Ken", player.id);

    const usage = await getCharacterUsage(player.id);
    expect(usage.map((u) => u.character)).toEqual(["Terry", "Bowser", "Cloud"]);
  });

  it("excludes games from matches that aren't confirmed", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createPendingMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);

    expect(await getCharacterUsage(player.id)).toEqual([]);
  });

  it("excludes games with no winner (disputed/void)", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", null);

    expect(await getCharacterUsage(player.id)).toEqual([]);
  });

  it("excludes games from a match where the player's own side was practicing", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id, { player1IsPracticing: true });
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);

    expect(await getCharacterUsage(player.id)).toEqual([]);
  });

  it("still counts a match for the opponent when only the player's side was practicing", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id, { player1IsPracticing: true });
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", opponent.id);

    expect(await getCharacterUsage(opponent.id)).toEqual([
      { character: "Ken", games: 1, wins: 1, losses: 0, winRate: 100, usagePercent: 100 },
    ]);
  });
});

describe("getCareerStats", () => {
  it("counts wins and losses from confirmed matches", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    await createConfirmedMatch(player.id, opponent.id, { reportedWinnerId: player.id });
    await createConfirmedMatch(opponent.id, player.id, { reportedWinnerId: opponent.id });

    const stats = await getCareerStats(player.id);
    expect(stats.totalWins).toBe(1);
    expect(stats.totalLosses).toBe(1);
  });

  it("excludes a match from the player's own record when their side was practicing", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    await createConfirmedMatch(player.id, opponent.id, {
      reportedWinnerId: player.id,
      player1IsPracticing: true,
    });

    const stats = await getCareerStats(player.id);
    expect(stats.totalWins).toBe(0);
    expect(stats.totalLosses).toBe(0);
  });

  it("still counts the match for the non-practicing opponent", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    await createConfirmedMatch(player.id, opponent.id, {
      reportedWinnerId: opponent.id,
      player1IsPracticing: true,
    });

    const stats = await getCareerStats(opponent.id);
    expect(stats.totalWins).toBe(1);
    expect(stats.totalLosses).toBe(0);
  });

  async function createConfirmedMatchAt(
    p1: string,
    p2: string,
    reportedWinnerId: string,
    confirmedAt: Date,
  ) {
    return prisma.ratingMatch.create({
      data: { player1Id: p1, player2Id: p2, status: MatchStatus.CONFIRMED, expiresAt: new Date(), reportedWinnerId, confirmedAt },
    });
  }

  it("finds the longest win streak across the player's whole history, not just the current one", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const base = Date.now();
    // W W W L W W (in order) -> longest streak is 3, current streak is 2.
    const results = [true, true, true, false, true, true];
    for (let i = 0; i < results.length; i++) {
      await createConfirmedMatchAt(
        player.id,
        opponent.id,
        results[i] ? player.id : opponent.id,
        new Date(base + i * 1000),
      );
    }

    const stats = await getCareerStats(player.id);
    expect(stats.bestWinStreak).toBe(3);
  });

  it("is 0 for a player with no wins", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    await createConfirmedMatchAt(player.id, opponent.id, opponent.id, new Date());

    const stats = await getCareerStats(player.id);
    expect(stats.bestWinStreak).toBe(0);
  });

  it("excludes practice matches from the streak", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const base = Date.now();
    await createConfirmedMatchAt(player.id, opponent.id, player.id, new Date(base));
    await createConfirmedMatch(player.id, opponent.id, {
      reportedWinnerId: player.id,
      player1IsPracticing: true,
    });
    await createConfirmedMatchAt(player.id, opponent.id, player.id, new Date(base + 1000));

    const stats = await getCareerStats(player.id);
    // Only the two non-practice wins should count toward the streak.
    expect(stats.bestWinStreak).toBe(2);
  });
});

describe("getPlayerMatchHistory", () => {
  it("includes the per-game score and the distinct characters played", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);
    await createGame(match.id, 2, player.id, "Terry", opponent.id, "Ken", opponent.id);
    await createGame(match.id, 3, player.id, "Cloud", opponent.id, "Ken", player.id);

    const [entry] = await getPlayerMatchHistory(player.id);
    expect(entry.score).toEqual({ wins: 2, losses: 1 });
    expect(entry.characters).toEqual(["Terry", "Cloud"]);
    expect(entry.opponentCharacters).toEqual(["Ken"]);
  });

  it("ignores games with no decided winner when computing score", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    const match = await createConfirmedMatch(player.id, opponent.id);
    await createGame(match.id, 1, player.id, "Terry", opponent.id, "Ken", player.id);
    await createGame(match.id, 2, player.id, null, opponent.id, null, null);

    const [entry] = await getPlayerMatchHistory(player.id);
    expect(entry.score).toEqual({ wins: 1, losses: 0 });
    expect(entry.characters).toEqual(["Terry"]);
  });

  it("returns an empty score and character list when no games were recorded", async () => {
    const player = await createTestUser();
    const opponent = await createTestUser();
    await createConfirmedMatch(player.id, opponent.id);

    const [entry] = await getPlayerMatchHistory(player.id);
    expect(entry.score).toEqual({ wins: 0, losses: 0 });
    expect(entry.characters).toEqual([]);
    expect(entry.opponentCharacters).toEqual([]);
  });
});
