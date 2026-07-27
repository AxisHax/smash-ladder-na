import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { requireActiveUser, setWiredConnection } from "@/lib/account";
import { UserStatus } from "@/generated/prisma/enums";
import { createTestUser } from "@/test/factories";

describe("requireActiveUser — suspension expiry", () => {
  it("throws while a timed suspension is still in the future", async () => {
    const user = await createTestUser({
      status: UserStatus.SUSPENDED,
      suspendedUntil: new Date(Date.now() + 60 * 60 * 1000),
    });
    await expect(requireActiveUser(user.id)).rejects.toThrow(/suspended/i);
  });

  it("lazily lifts an expired timed suspension back to ACTIVE", async () => {
    const user = await createTestUser({
      status: UserStatus.SUSPENDED,
      suspendedUntil: new Date(Date.now() - 60 * 60 * 1000),
    });
    await expect(requireActiveUser(user.id)).resolves.toBeUndefined();

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.status).toBe(UserStatus.ACTIVE);
    expect(updated.suspendedUntil).toBeNull();
  });

  it("never lifts an indefinite suspension (suspendedUntil null)", async () => {
    const user = await createTestUser({ status: UserStatus.SUSPENDED, suspendedUntil: null });
    await expect(requireActiveUser(user.id)).rejects.toThrow(/suspended/i);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.status).toBe(UserStatus.SUSPENDED);
  });

  it("still throws for a banned user regardless of suspendedUntil", async () => {
    const user = await createTestUser({ status: UserStatus.BANNED });
    await expect(requireActiveUser(user.id)).rejects.toThrow(/banned/i);
  });
});

describe("setWiredConnection", () => {
  it("allows declaring wired with no connection reports", async () => {
    const user = await createTestUser();
    await setWiredConnection(user.id, true);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.wiredConnection).toBe(true);
  });

  it("blocks declaring wired once enough opponents have disputed it", async () => {
    const user = await createTestUser({ gamesPlayed: 0 });
    for (let i = 0; i < 3; i++) {
      const opponent = await createTestUser();
      const match = await prisma.ratingMatch.create({
        data: { player1Id: opponent.id, player2Id: user.id, status: "PENDING_REPORT", expiresAt: new Date() },
      });
      await prisma.connectionReport.create({
        data: { matchId: match.id, reporterId: opponent.id, reportedUserId: user.id },
      });
    }

    await expect(setWiredConnection(user.id, true)).rejects.toThrow(/reported connection issues/i);
  });

  it("allows turning wired off regardless of connection report count", async () => {
    const user = await createTestUser({ wiredConnection: true, gamesPlayed: 0 });
    for (let i = 0; i < 3; i++) {
      const opponent = await createTestUser();
      const match = await prisma.ratingMatch.create({
        data: { player1Id: opponent.id, player2Id: user.id, status: "PENDING_REPORT", expiresAt: new Date() },
      });
      await prisma.connectionReport.create({
        data: { matchId: match.id, reporterId: opponent.id, reportedUserId: user.id },
      });
    }

    await expect(setWiredConnection(user.id, false)).resolves.toBeUndefined();
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.wiredConnection).toBe(false);
  });
});
