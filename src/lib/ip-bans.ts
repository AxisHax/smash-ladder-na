import { prisma } from "@/lib/db";

// x-forwarded-for can be a comma-separated proxy chain (client, proxy1,
// proxy2, ...) — the first entry is the original client, which is what
// Vercel's edge network sets it to.
export function extractClientIp(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const first = headerValue.split(",")[0]?.trim();
  return first || null;
}

export async function isIpBanned(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  const banned = await prisma.bannedIp.findUnique({ where: { ip } });
  return banned !== null;
}

export async function banIp(ip: string, reason?: string) {
  const trimmed = ip.trim();
  if (!trimmed) throw new Error("IP address is required");
  await prisma.bannedIp.upsert({
    where: { ip: trimmed },
    update: { reason: reason?.trim() || undefined },
    create: { ip: trimmed, reason: reason?.trim() || undefined },
  });
}

export async function unbanIp(ip: string) {
  await prisma.bannedIp.deleteMany({ where: { ip: ip.trim() } });
}

export async function listBannedIps() {
  return prisma.bannedIp.findMany({ orderBy: { createdAt: "desc" } });
}
