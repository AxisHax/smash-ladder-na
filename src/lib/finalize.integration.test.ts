import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { finalizeExpiredMatches } from "@/lib/finalize";
import { MatchStatus } from "@/generated/prisma/enums";
import { createTestUser } from "@/test/factories";

const past = new Date(Date.now() - 60_000);

describe("finalizeExpiredMatches", () => {
  it("expires a match nobody reported on, with no rating impact", async () => {
    const a = await createTestUser({ rating: 1500 });
    const b = await createTestUser({ rating: 1500 });
    const match = await prisma.ratingMatch.create({
      data: {
        player1Id: a.id,
        player2Id: b.id,
        status: MatchStatus.PENDING_REPORT,
        expiresAt: past,
      },
    });

    const result = await finalizeExpiredMatches(new Date());

    expect(result.expiredNoReport).toBe(1);
    expect(result.autoConfirmed).toBe(0);
    const updated = await prisma.ratingMatch.findUniqueOrThrow({ where: { id: match.id } });
    expect(updated.status).toBe(MatchStatus.EXPIRED);
    const [userA, userB] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: a.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: b.id } }),
    ]);
    expect(userA.rating).toBe(1500);
    expect(userB.rating).toBe(1500);
  });

  it("auto-confirms a hanging report and charges the non-reporter a no-show", async () => {
    const reporter = await createTestUser({ rating: 1500 });
    const ghost = await createTestUser({ rating: 1500 });
    const match = await prisma.ratingMatch.create({
      data: {
        player1Id: reporter.id,
        player2Id: ghost.id,
        status: MatchStatus.PENDING_REPORT,
        expiresAt: past,
      },
    });
    await prisma.matchGame.create({
      data: {
        matchId: match.id,
        gameNumber: 1,
        actorAId: reporter.id,
        actorAStrikes: 1,
        actorBId: ghost.id,
        actorBStrikes: 2,
        finalStage: "Battlefield",
        reportedWinnerId: reporter.id,
        reportedById: reporter.id,
        reportedAt: past,
      },
    });

    const result = await finalizeExpiredMatches(new Date());

    expect(result.autoConfirmed).toBe(1);
    expect(result.expiredNoReport).toBe(0);

    const updatedGhost = await prisma.user.findUniqueOrThrow({ where: { id: ghost.id } });
    expect(updatedGhost.noShowCount).toBe(1);
  });

  it("leaves not-yet-expired matches untouched", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    await prisma.ratingMatch.create({
      data: {
        player1Id: a.id,
        player2Id: b.id,
        status: MatchStatus.PENDING_REPORT,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const result = await finalizeExpiredMatches(new Date());
    expect(result.expiredNoReport).toBe(0);
    expect(result.autoConfirmed).toBe(0);
  });

  it("awards the set to a player already ahead 1-0 when the opponent never responds again", async () => {
    const leader = await createTestUser({ rating: 1500 });
    const ghost = await createTestUser({ rating: 1500 });
    const match = await prisma.ratingMatch.create({
      data: { player1Id: leader.id, player2Id: ghost.id, status: MatchStatus.PENDING_REPORT, expiresAt: past },
    });
    await prisma.matchGame.create({
      data: {
        matchId: match.id,
        gameNumber: 1,
        actorAId: leader.id,
        actorAStrikes: 1,
        actorBId: ghost.id,
        actorBStrikes: 2,
        finalStage: "Battlefield",
        winnerId: leader.id,
      },
    });
    // Game 2 exists but nobody ever locked in a character or reported it.
    await prisma.matchGame.create({
      data: { matchId: match.id, gameNumber: 2, actorAId: leader.id, actorAStrikes: 3, actorBId: ghost.id, actorBStrikes: 0 },
    });

    const result = await finalizeExpiredMatches(new Date());

    expect(result.closedOutOnLead).toBe(1);
    expect(result.autoConfirmed).toBe(0);
    expect(result.expiredNoReport).toBe(0);

    const updatedMatch = await prisma.ratingMatch.findUniqueOrThrow({ where: { id: match.id } });
    expect(updatedMatch.status).toBe(MatchStatus.CONFIRMED);
    expect(updatedMatch.reportedWinnerId).toBe(leader.id);

    const [updatedLeader, updatedGhost] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: leader.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: ghost.id } }),
    ]);
    expect(updatedLeader.rating).toBeGreaterThan(1500);
    expect(updatedGhost.rating).toBeLessThan(1500);
    expect(updatedGhost.noShowCount).toBe(1);
    expect(updatedGhost.queueCooldownUntil).not.toBeNull();
  });

  it("awards the set to a player already ahead 2-0 the same way", async () => {
    const leader = await createTestUser({ rating: 1500 });
    const ghost = await createTestUser({ rating: 1500 });
    const match = await prisma.ratingMatch.create({
      data: { player1Id: leader.id, player2Id: ghost.id, status: MatchStatus.PENDING_REPORT, expiresAt: past },
    });
    for (let gameNumber = 1; gameNumber <= 2; gameNumber++) {
      await prisma.matchGame.create({
        data: {
          matchId: match.id,
          gameNumber,
          actorAId: leader.id,
          actorAStrikes: 1,
          actorBId: ghost.id,
          actorBStrikes: 2,
          finalStage: "Battlefield",
          winnerId: leader.id,
        },
      });
    }

    const result = await finalizeExpiredMatches(new Date());

    expect(result.closedOutOnLead).toBe(1);
    const updatedMatch = await prisma.ratingMatch.findUniqueOrThrow({ where: { id: match.id } });
    expect(updatedMatch.status).toBe(MatchStatus.CONFIRMED);
    expect(updatedMatch.reportedWinnerId).toBe(leader.id);
  });

  it("does NOT auto-confirm or award a match whose current game is contested", async () => {
    const a = await createTestUser({ rating: 1500 });
    const b = await createTestUser({ rating: 1500 });
    const match = await prisma.ratingMatch.create({
      data: { player1Id: a.id, player2Id: b.id, status: MatchStatus.PENDING_REPORT, expiresAt: past },
    });
    await prisma.matchGame.create({
      data: {
        matchId: match.id,
        gameNumber: 1,
        actorAId: a.id,
        actorAStrikes: 1,
        actorBId: b.id,
        actorBStrikes: 2,
        finalStage: "Battlefield",
        winnerId: a.id,
      },
    });
    // Game 2: both sides reported, disagreed — contested, not escalated. The
    // finalizer must neither accept the first reporter's claim (autoConfirm)
    // nor hand the set to the leader (closeOutUnansweredLead), since the
    // trailing side DID respond — they just disagree on the winner.
    await prisma.matchGame.create({
      data: {
        matchId: match.id,
        gameNumber: 2,
        actorAId: a.id,
        actorAStrikes: 3,
        actorBId: b.id,
        actorBStrikes: 0,
        finalStage: "Battlefield",
        reportedWinnerId: a.id,
        reportedById: a.id,
        reportedAt: past,
        secondReportWinnerId: b.id,
        secondReportById: b.id,
        secondReportAt: past,
      },
    });

    const result = await finalizeExpiredMatches(new Date());

    expect(result.autoConfirmed).toBe(0);
    expect(result.closedOutOnLead).toBe(0);
    expect(result.expiredNoReport).toBe(1);
    const updatedMatch = await prisma.ratingMatch.findUniqueOrThrow({ where: { id: match.id } });
    expect(updatedMatch.status).toBe(MatchStatus.EXPIRED);
    const [userA, userB] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: a.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: b.id } }),
    ]);
    expect(userA.rating).toBe(1500);
    expect(userB.rating).toBe(1500);
  });

  it("does NOT auto-close a genuinely contested score (both sides have a win)", async () => {
    const a = await createTestUser({ rating: 1500 });
    const b = await createTestUser({ rating: 1500 });
    const match = await prisma.ratingMatch.create({
      data: { player1Id: a.id, player2Id: b.id, status: MatchStatus.PENDING_REPORT, expiresAt: past },
    });
    await prisma.matchGame.create({
      data: {
        matchId: match.id,
        gameNumber: 1,
        actorAId: a.id,
        actorAStrikes: 1,
        actorBId: b.id,
        actorBStrikes: 2,
        finalStage: "Battlefield",
        winnerId: a.id,
      },
    });
    await prisma.matchGame.create({
      data: {
        matchId: match.id,
        gameNumber: 2,
        actorAId: a.id,
        actorAStrikes: 3,
        actorBId: b.id,
        actorBStrikes: 0,
        finalStage: "Battlefield",
        winnerId: b.id,
      },
    });

    const result = await finalizeExpiredMatches(new Date());

    expect(result.closedOutOnLead).toBe(0);
    expect(result.expiredNoReport).toBe(1);
    const updatedMatch = await prisma.ratingMatch.findUniqueOrThrow({ where: { id: match.id } });
    expect(updatedMatch.status).toBe(MatchStatus.EXPIRED);
  });
});
