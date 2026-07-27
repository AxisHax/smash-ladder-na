import { prisma, TX_OPTIONS, withTransientRetry } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { MatchStatus, ConfirmationMethod } from "@/generated/prisma/enums";
import { applyEloAndConfirm } from "@/lib/matches";
import { tallySetWins, GAMES_TO_WIN } from "@/lib/match-games";
import { sendDiscordDM } from "@/lib/discord-bot";

// Same shape as matches.ts's matchWithPlayers, plus report/block counts —
// kept separate rather than added to that shared constant since this
// moderation context (how many times each side has been reported or
// blocked) is only relevant for mods reviewing a dispute, not regular
// match display.
const disputePlayerSelect = {
  select: {
    id: true,
    username: true,
    avatarUrl: true,
    rating: true,
    mainCharacter: true,
    _count: { select: { reportsReceived: true, blocksReceived: true } },
  },
} as const;

// A disputed game (both sides reported, but disagreed) no longer flips the
// whole match to a blocking DISPUTED status — the set keeps going on the
// other games while this one waits for a mod. So "disputed" now means
// "this specific game", not "this match": winnerId is still null, but both
// a report and a conflicting second report exist.
export async function listDisputedGames() {
  const games = await prisma.matchGame.findMany({
    where: {
      winnerId: null,
      reportedWinnerId: { not: null },
      secondReportWinnerId: { not: null },
      // If the set already confirmed via its other games (or got cancelled),
      // this dispute is moot — resolving it can't change the outcome, so it
      // shouldn't keep cluttering the mod queue.
      match: { status: { notIn: [MatchStatus.CONFIRMED, MatchStatus.CANCELLED] } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      match: {
        include: { player1: disputePlayerSelect, player2: disputePlayerSelect },
      },
    },
  });
  // Prisma can't express "these two columns differ" directly in a where
  // clause, so that check happens here instead.
  return games.filter((g) => g.reportedWinnerId !== g.secondReportWinnerId);
}

// Shared by the mod ruling (resolveDisputedGame) and the self-service
// player agreement (requestDisputeResolution) — both end up doing exactly
// the same thing to the game/match/Elo once a winner is settled on, just
// via different paths to get there.
async function applyDisputeRuling(
  tx: Prisma.TransactionClient,
  match: { id: string; player1Id: string; player2Id: string },
  gameNumber: number,
  winnerId: string,
  confirmationMethod: ConfirmationMethod,
) {
  if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
    throw new Error("Winner must be one of the two players");
  }

  const game = await tx.matchGame.findUnique({
    where: { matchId_gameNumber: { matchId: match.id, gameNumber } },
  });
  if (!game) throw new Error("Game not found");
  if (game.winnerId) throw new Error("This game is already decided");

  // secondReport* already records the disagreeing second report from
  // reportGameResult; a ruling shouldn't overwrite that history.
  await tx.matchGame.update({ where: { id: game.id }, data: { winnerId } });

  const games = await tx.matchGame.findMany({ where: { matchId: match.id } });
  const wins = tallySetWins(games);
  const setWinnerId = Object.entries(wins).find(([, count]) => count >= GAMES_TO_WIN)?.[0];

  if (setWinnerId) {
    await tx.ratingMatch.update({
      where: { id: match.id },
      data: { reportedWinnerId: setWinnerId, reportedById: setWinnerId, reportedAt: new Date() },
    });
    await applyEloAndConfirm(tx, match, setWinnerId, confirmationMethod, null);
  }

  return setWinnerId;
}

export async function resolveDisputedGame(matchId: string, gameNumber: number, winnerId: string) {
  const result = await withTransientRetry(() =>
    prisma.$transaction(async (tx) => {
      const match = await tx.ratingMatch.findUnique({ where: { id: matchId } });
      if (!match) throw new Error("Match not found");
      const setWinnerId = await applyDisputeRuling(
        tx,
        match,
        gameNumber,
        winnerId,
        ConfirmationMethod.ADMIN_RESOLVED,
      );
      return { match, setWinnerId };
    }, TX_OPTIONS),
  );

  const [p1, p2] = await Promise.all([
    prisma.user.findUnique({ where: { id: result.match.player1Id }, select: { discordId: true } }),
    prisma.user.findUnique({ where: { id: result.match.player2Id }, select: { discordId: true } }),
  ]);
  const message = result.setWinnerId
    ? `⚖️ A mod resolved game ${gameNumber}'s disputed result — your set is now confirmed.`
    : `⚖️ A mod resolved game ${gameNumber}'s disputed result. The set continues.`;
  if (p1) await sendDiscordDM(p1.discordId, message);
  if (p2) await sendDiscordDM(p2.discordId, message);
}

// Self-service alternative to waiting on a mod: once a game is disputed
// (both sides reported, but disagreed), either player can submit who they
// now believe actually won. Same both-must-agree shape as the original
// report/secondReport flow and requestResultCorrection — the first vote
// just records itself; the second either matches (resolved immediately,
// same as a mod ruling) or doesn't (reset back to null so either side can
// try again, and it stays queued for a mod in the meantime).
export async function requestDisputeResolution(
  userId: string,
  matchId: string,
  gameNumber: number,
  winnerId: string,
) {
  return withTransientRetry(() =>
    prisma.$transaction(async (tx) => {
      const match = await tx.ratingMatch.findUnique({ where: { id: matchId } });
      if (!match) throw new Error("Match not found");
      if (match.player1Id !== userId && match.player2Id !== userId) {
        throw new Error("Not a participant in this match");
      }

      const game = await tx.matchGame.findUnique({
        where: { matchId_gameNumber: { matchId, gameNumber } },
      });
      if (!game) throw new Error("Game not found");
      if (game.winnerId) throw new Error("This game is already decided");
      if (!game.reportedWinnerId || !game.secondReportWinnerId || game.reportedWinnerId === game.secondReportWinnerId) {
        throw new Error("This game isn't disputed");
      }

      if (!game.disputeResolutionById || game.disputeResolutionById === userId) {
        // First vote, or this same player revising their own pending one.
        await tx.matchGame.update({
          where: { id: game.id },
          data: { disputeResolutionWinnerId: winnerId, disputeResolutionById: userId, disputeResolutionAt: new Date() },
        });
        return { resolved: false };
      }

      if (winnerId !== game.disputeResolutionWinnerId) {
        // Still don't agree — clear it so either side can try again fresh
        // rather than leaving a stale one-sided vote sitting there.
        await tx.matchGame.update({
          where: { id: game.id },
          data: { disputeResolutionWinnerId: null, disputeResolutionById: null, disputeResolutionAt: null },
        });
        return { resolved: false, stillDisputed: true };
      }

      const setWinnerId = await applyDisputeRuling(
        tx,
        match,
        gameNumber,
        winnerId,
        ConfirmationMethod.MUTUALLY_RESOLVED,
      );
      return { resolved: true, setWinnerId };
    }, TX_OPTIONS),
  );
}

// Matches actively being played right now — not yet CONFIRMED/CANCELLED/
// EXPIRED — for the mod-facing "Live matches" view. REPORTED is legacy
// (nothing writes it anymore) but old rows can still carry it.
export async function listLiveMatches() {
  return prisma.ratingMatch.findMany({
    where: { status: { in: [MatchStatus.PENDING_REPORT, MatchStatus.REPORTED, MatchStatus.DISPUTED] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      roomCode: true,
      createdAt: true,
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      games: { select: { gameNumber: true, winnerId: true, finalStage: true } },
    },
  });
}

// A mod can still cancel the whole match outright (e.g. an unsalvageable
// dispute, or bad-faith reporting) regardless of its current status — the
// self-service cancelMatch is deliberately narrower (PENDING_REPORT/
// REPORTED only) since a player shouldn't be able to back out of a match
// that's already progressed past that.
export async function adminCancelMatch(matchId: string) {
  await prisma.ratingMatch.updateMany({
    where: { id: matchId, status: { notIn: [MatchStatus.CONFIRMED, MatchStatus.CANCELLED] } },
    data: { status: MatchStatus.CANCELLED },
  });
}
