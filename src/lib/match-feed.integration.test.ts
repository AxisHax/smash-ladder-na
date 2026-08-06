import { describe, it, expect, vi, afterEach } from "vitest";
import { prisma } from "@/lib/db";
import { getMatchFeed } from "@/lib/match-feed";
import { MatchStatus } from "@/generated/prisma/enums";
import { createTestUser } from "@/test/factories";

vi.mock("@/lib/twitch-helix", () => ({
  getLiveTwitchUsernames: vi.fn(),
}));

describe("getMatchFeed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("only treats a match as having a live streamer while it's still in progress", async () => {
    const { getLiveTwitchUsernames } = await import("@/lib/twitch-helix");
    vi.mocked(getLiveTwitchUsernames).mockResolvedValue(new Set(["streamerchannel"]));

    const streamer = await createTestUser({ twitchUsername: "StreamerChannel" });
    const opponent = await createTestUser();

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const inProgress = await prisma.ratingMatch.create({
      data: { player1Id: streamer.id, player2Id: opponent.id, status: MatchStatus.PENDING_REPORT, expiresAt },
    });
    const finished = await prisma.ratingMatch.create({
      data: {
        player1Id: streamer.id,
        player2Id: opponent.id,
        status: MatchStatus.CONFIRMED,
        confirmedAt: new Date(),
        reportedWinnerId: streamer.id,
        expiresAt,
      },
    });
    const cancelled = await prisma.ratingMatch.create({
      data: { player1Id: streamer.id, player2Id: opponent.id, status: MatchStatus.CANCELLED, expiresAt },
    });

    const entries = await getMatchFeed();
    const byId = new Map(entries.map((e) => [e.id, e]));

    expect(byId.get(inProgress.id)?.hasLiveStreamer).toBe(true);
    expect(byId.get(finished.id)?.hasLiveStreamer).toBe(false);
    expect(byId.get(cancelled.id)?.hasLiveStreamer).toBe(false);
  });
});
