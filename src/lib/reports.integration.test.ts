import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { fileConnectionReport } from "@/lib/reports";
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
