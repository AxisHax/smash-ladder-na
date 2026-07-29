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

// Caps how many secondaries a player can self-declare, and how many
// recomputeCharacterUsage below will derive from real play — a handful is
// enough without the profile turning into "plays everyone."
const MAX_SECONDARY_CHARACTERS = 5;

// Players complained the old peer-reported main (see recomputeCharacterUsage
// below, which replaced it) kept landing on the wrong character — this lets
// a player take full ownership of their own profile instead. Once set,
// recomputeCharacterUsage stops touching this profile entirely (see
// charactersSelfDeclared above).
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
// actually plays, derived fresh from real game data every time — replaced
// the old peer-report mechanism (an opponent manually reporting your
// character after a match), which kept freezing on whichever character got
// reported first. Called for both players every time a match confirms —
// see applyEloAndConfirm. Skipped entirely once self-declared.
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
