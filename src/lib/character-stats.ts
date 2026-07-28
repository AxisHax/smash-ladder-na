import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { SMASH_CHARACTERS, type SmashCharacter } from "@/lib/characters";
import { LEADERBOARD_MIN_GAMES } from "@/lib/rank-tier";
import { getCharacterUsage } from "@/lib/players";

function assertValidCharacter(character: string): asserts character is SmashCharacter {
  if (!(SMASH_CHARACTERS as readonly string[]).includes(character)) {
    throw new Error("Not a recognized character");
  }
}

export async function getCharacterLeaderboard(character: string) {
  assertValidCharacter(character);
  return prisma.user.findMany({
    where: {
      gamesPlayed: { gte: LEADERBOARD_MIN_GAMES },
      OR: [{ mainCharacter: character }, { secondaryCharacters: { has: character } }],
    },
    orderBy: { rating: "desc" },
    select: { id: true, username: true, rating: true, gamesPlayed: true },
  });
}

// Caps how many secondaries accumulate from peer reports, and how many a
// player can self-declare — a handful is enough to stop opponents banning
// around a single reported character (the original problem) without the
// profile turning into "plays everyone."
const MAX_SECONDARY_CHARACTERS = 5;

// Peer-reported by default — set by whoever actually played against you,
// not the player themselves, so it can't be gamed or just go stale. The
// first character anyone ever reports becomes mainCharacter; anything
// different reported later accumulates into secondaryCharacters instead of
// overwriting it, so a player who plays multiple characters doesn't get
// reduced to whichever one an opponent happened to report most recently.
//
// No-ops entirely once the player has self-declared via setOwnCharacters
// (see charactersSelfDeclared) — peer reports kept landing on a character
// the player didn't actually consider their main, so a player who's taken
// ownership of their own profile has the final say from then on.
export async function reportOpponentCharacter(
  reporterId: string,
  matchId: string,
  character: string,
) {
  assertValidCharacter(character);

  const match = await prisma.ratingMatch.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  if (match.player1Id !== reporterId && match.player2Id !== reporterId) {
    throw new Error("Not a participant in this match");
  }

  const opponentId = match.player1Id === reporterId ? match.player2Id : match.player1Id;
  const opponent = await prisma.user.findUniqueOrThrow({
    where: { id: opponentId },
    select: { mainCharacter: true, secondaryCharacters: true, charactersSelfDeclared: true },
  });
  if (opponent.charactersSelfDeclared) return;

  if (opponent.mainCharacter === null) {
    await prisma.user.update({ where: { id: opponentId }, data: { mainCharacter: character } });
    return;
  }
  if (
    character === opponent.mainCharacter ||
    opponent.secondaryCharacters.includes(character) ||
    opponent.secondaryCharacters.length >= MAX_SECONDARY_CHARACTERS
  ) {
    return;
  }
  await prisma.user.update({
    where: { id: opponentId },
    data: { secondaryCharacters: { push: character } },
  });
}

// Players complained peer reports kept landing on the wrong main (a stale
// report, a bad guess, an early low-effort match) — this lets a player take
// full ownership of their own profile instead. Once set, reportOpponentCharacter
// stops touching this profile entirely (see charactersSelfDeclared above).
export async function setOwnCharacters(
  userId: string,
  mainCharacter: string | null,
  secondaryCharacters: string[],
) {
  if (mainCharacter !== null) assertValidCharacter(mainCharacter);
  const deduped = [...new Set(secondaryCharacters)];
  for (const c of deduped) assertValidCharacter(c);
  if (mainCharacter !== null && deduped.includes(mainCharacter)) {
    throw new Error("A character can't be both your main and a secondary");
  }
  if (deduped.length > MAX_SECONDARY_CHARACTERS) {
    throw new Error(`You can list at most ${MAX_SECONDARY_CHARACTERS} secondary characters`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mainCharacter, secondaryCharacters: deduped, charactersSelfDeclared: true },
  });
}

// Keeps mainCharacter/secondaryCharacters in sync with what a player
// actually plays, rather than freezing on whichever character an opponent
// happened to report first (reportOpponentCharacter's old sole mechanism —
// still runs, but its writes get overwritten by this on the very next
// confirmed match either way, since this always derives fresh from real
// game data). Called for both players every time a match confirms — see
// applyEloAndConfirm. Skipped entirely once self-declared, same rule
// reportOpponentCharacter follows.
export async function recomputeCharacterUsage(userId: string, tx: Prisma.TransactionClient) {
  const user = await tx.user.findUniqueOrThrow({
    where: { id: userId },
    select: { charactersSelfDeclared: true },
  });
  if (user.charactersSelfDeclared) return;

  const usage = await getCharacterUsage(userId, tx);
  const mainCharacter = usage[0]?.character ?? null;
  const secondaryCharacters = usage.slice(1, 1 + MAX_SECONDARY_CHARACTERS).map((u) => u.character);

  await tx.user.update({
    where: { id: userId },
    data: { mainCharacter, secondaryCharacters },
  });
}
