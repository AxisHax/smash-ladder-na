import { prisma } from "@/lib/db";

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) throw new Error("You can't block yourself");
  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    update: {},
    create: { blockerId, blockedId },
  });
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await prisma.block.deleteMany({ where: { blockerId, blockedId } });
}

export async function isBlockedByMe(blockerId: string, blockedId: string) {
  const block = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  return block !== null;
}

export async function listBlockedUsers(blockerId: string) {
  return prisma.block.findMany({
    where: { blockerId },
    orderBy: { createdAt: "desc" },
    include: { blocked: { select: { id: true, username: true, avatarUrl: true } } },
  });
}

// Matchmaking treats a block as mutual either way — if either side blocked
// the other, they shouldn't be paired, regardless of who queues first.
export async function getBlockedEitherWayIds(userId: string) {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    select: { blockerId: true, blockedId: true },
  });
  return blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
}

export function blockPairKey(userAId: string, userBId: string) {
  return userAId < userBId ? `${userAId}|${userBId}` : `${userBId}|${userAId}`;
}

// For sweepLobbyPairing's O(n^2) scan — one query up front instead of one
// per candidate pair.
export async function getAllBlockedPairKeys() {
  const blocks = await prisma.block.findMany({ select: { blockerId: true, blockedId: true } });
  return new Set(blocks.map((b) => blockPairKey(b.blockerId, b.blockedId)));
}
