import { prisma } from "@/lib/db";
import { LobbyEntryStatus, MatchStatus, PostStatus, UserRole } from "@/generated/prisma/enums";
import { autoConfirmStaleGameReport } from "@/lib/match-games";
import { sendDiscordDM } from "@/lib/discord-bot";

export async function finalizeExpiredLobbyEntries(now = new Date()) {
  const result = await prisma.ratingLobbyEntry.updateMany({
    where: { status: LobbyEntryStatus.WAITING, expiresAt: { lt: now } },
    data: { status: LobbyEntryStatus.EXPIRED },
  });
  return result.count;
}

// So mods have visibility into abandoned sets without checking /admin/live
// every morning — added after a batch of matches sat all night with nobody
// reporting, going unnoticed until players started messaging directly.
async function alertModsOfAbandonedMatch(message: string) {
  const mods = await prisma.user.findMany({
    where: { role: { in: [UserRole.MOD, UserRole.ADMIN] } },
    select: { discordId: true },
  });
  await Promise.all(mods.map((mod) => sendDiscordDM(mod.discordId, message)));
}

export async function finalizeExpiredMatches(now = new Date()) {
  const overdue = await prisma.ratingMatch.findMany({
    where: { status: MatchStatus.PENDING_REPORT, expiresAt: { lt: now } },
    select: {
      id: true,
      player1Id: true,
      player2Id: true,
      player1: { select: { username: true } },
      player2: { select: { username: true } },
    },
  });

  // Reporting is per-game (BO3), not per-match, so "timed out" is decided
  // per match by whether its current game has a lone unconfirmed report —
  // that side did their part, so their report is accepted and the other
  // side is charged a no-show. A match with no hanging report (nobody
  // reported anything, or the current game isn't even decided yet) just
  // expires below with no rating impact for either player.
  let autoConfirmed = 0;
  const handledIds = new Set<string>();
  for (const match of overdue) {
    const result = await autoConfirmStaleGameReport(match, now);
    if (!result) continue;
    autoConfirmed++;
    handledIds.add(match.id);

    const reporterName = result.reporterId === match.player1Id ? match.player1.username : match.player2.username;
    const nonReporterName =
      result.nonReporterId === match.player1Id ? match.player1.username : match.player2.username;
    await alertModsOfAbandonedMatch(
      `⏱️ Auto-confirmed: ${match.player1.username} vs ${match.player2.username}, game ${result.gameNumber} — ${reporterName}'s report was accepted after ${nonReporterName} didn't respond in time.`,
    );
  }

  const stillUnhandled = overdue.filter((m) => !handledIds.has(m.id));
  await Promise.all(
    stillUnhandled.map((m) =>
      alertModsOfAbandonedMatch(
        `🚫 Expired with no report: ${m.player1.username} vs ${m.player2.username} — closed with no rating impact for either side. Force-confirm from /admin/live if you know who actually won.`,
      ),
    ),
  );

  const expiredNoReport = await prisma.ratingMatch.updateMany({
    where: {
      status: MatchStatus.PENDING_REPORT,
      expiresAt: { lt: now },
      id: { in: stillUnhandled.map((m) => m.id) },
    },
    data: { status: MatchStatus.EXPIRED },
  });

  return { expiredNoReport: expiredNoReport.count, autoConfirmed };
}

export async function finalizeExpiredFreeBattlePosts(now = new Date()) {
  const result = await prisma.freeBattlePost.updateMany({
    where: { status: PostStatus.OPEN, expiresAt: { lt: now } },
    data: { status: PostStatus.EXPIRED },
  });
  return result.count;
}
