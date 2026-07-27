import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { fileConnectionReport, moderateUserDirectly } from "@/lib/reports";
import { UserStatus } from "@/generated/prisma/enums";
import { createTestUser } from "@/test/factories";

async function createMatch(p1: string, p2: string) {
  return prisma.ratingMatch.create({
    data: { player1Id: p1, player2Id: p2, status: "PENDING_REPORT", expiresAt: new Date() },
  });
}

describe("fileConnectionReport", () => {
  it("records a report against the opponent", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const match = await createMatch(a.id, b.id);

    await fileConnectionReport(a.id, match.id);

    const reports = await prisma.connectionReport.findMany({ where: { matchId: match.id } });
    expect(reports).toHaveLength(1);
    expect(reports[0].reporterId).toBe(a.id);
    expect(reports[0].reportedUserId).toBe(b.id);
  });

  it("is a no-op on a repeat report for the same match", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const match = await createMatch(a.id, b.id);

    await fileConnectionReport(a.id, match.id);
    await fileConnectionReport(a.id, match.id);

    const reports = await prisma.connectionReport.findMany({ where: { matchId: match.id } });
    expect(reports).toHaveLength(1);
  });

  it("rejects a non-participant", async () => {
    const a = await createTestUser();
    const b = await createTestUser();
    const outsider = await createTestUser();
    const match = await createMatch(a.id, b.id);

    await expect(fileConnectionReport(outsider.id, match.id)).rejects.toThrow(/not a participant/i);
  });
});

describe("moderateUserDirectly", () => {
  it("insta-suspends with a timed expiry, bypassing report thresholds", async () => {
    const mod = await createTestUser();
    const target = await createTestUser();

    await moderateUserDirectly(mod.id, target.id, "SUSPEND", { suspensionHours: 24, reason: "test" });

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(updated.status).toBe(UserStatus.SUSPENDED);
    expect(updated.suspendedUntil).not.toBeNull();
    expect(updated.suspendedUntil!.getTime()).toBeGreaterThan(Date.now());

    const auditReport = await prisma.conductReport.findFirst({
      where: { reporterId: mod.id, reportedUserId: target.id },
    });
    expect(auditReport?.status).toBe("ACTIONED");
    expect(auditReport?.reason).toBe("test");
  });

  it("insta-suspends indefinitely when no duration is given", async () => {
    const mod = await createTestUser();
    const target = await createTestUser();

    await moderateUserDirectly(mod.id, target.id, "SUSPEND", { suspensionHours: null });

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(updated.status).toBe(UserStatus.SUSPENDED);
    expect(updated.suspendedUntil).toBeNull();
  });

  it("insta-bans regardless of report count", async () => {
    const mod = await createTestUser();
    const target = await createTestUser();

    await moderateUserDirectly(mod.id, target.id, "BAN");

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(updated.status).toBe(UserStatus.BANNED);
  });

  it("reinstates a suspended or banned user back to ACTIVE", async () => {
    const mod = await createTestUser();
    const target = await createTestUser({ status: UserStatus.BANNED });

    await moderateUserDirectly(mod.id, target.id, "REINSTATE");

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(updated.status).toBe(UserStatus.ACTIVE);
    expect(updated.suspendedUntil).toBeNull();
  });

  it("rejects downgrading an already-banned user to suspended", async () => {
    const mod = await createTestUser();
    const target = await createTestUser({ status: UserStatus.BANNED });

    await expect(moderateUserDirectly(mod.id, target.id, "SUSPEND")).rejects.toThrow(/already banned/i);
  });
});
