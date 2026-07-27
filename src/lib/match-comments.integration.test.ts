import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { listMatchCommentsAsMod, postMatchCommentAsMod } from "@/lib/match-comments";
import { createTestUser } from "@/test/factories";

async function createMatch(p1: string, p2: string) {
  return prisma.ratingMatch.create({
    data: { player1Id: p1, player2Id: p2, status: "PENDING_REPORT", expiresAt: new Date() },
  });
}

describe("postMatchCommentAsMod / listMatchCommentsAsMod", () => {
  it("lets a mod (non-participant) post and read a match's comments", async () => {
    const p1 = await createTestUser();
    const p2 = await createTestUser();
    const mod = await createTestUser();
    const match = await createMatch(p1.id, p2.id);

    await postMatchCommentAsMod(mod.id, match.id, "please behave");

    const comments = await listMatchCommentsAsMod(match.id);
    expect(comments).toHaveLength(1);
    expect(comments[0].authorId).toBe(mod.id);
    expect(comments[0].body).toContain("please behave");
  });
});
