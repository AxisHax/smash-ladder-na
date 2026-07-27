import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { banIp, isIpBanned, unbanIp } from "@/lib/ip-bans";

describe("banIp / isIpBanned / unbanIp", () => {
  it("is not banned by default", async () => {
    expect(await isIpBanned("203.0.113.1")).toBe(false);
  });

  it("bans an IP and it's then reported as banned", async () => {
    await banIp("203.0.113.2", "test");
    expect(await isIpBanned("203.0.113.2")).toBe(true);

    const row = await prisma.bannedIp.findUnique({ where: { ip: "203.0.113.2" } });
    expect(row?.reason).toBe("test");
  });

  it("is idempotent — banning the same IP twice doesn't error", async () => {
    await banIp("203.0.113.3");
    await banIp("203.0.113.3", "updated reason");

    const row = await prisma.bannedIp.findUnique({ where: { ip: "203.0.113.3" } });
    expect(row?.reason).toBe("updated reason");
  });

  it("unbanning removes it from the deny-list", async () => {
    await banIp("203.0.113.4");
    await unbanIp("203.0.113.4");
    expect(await isIpBanned("203.0.113.4")).toBe(false);
  });

  it("null IP is never treated as banned", async () => {
    expect(await isIpBanned(null)).toBe(false);
  });
});
