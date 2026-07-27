import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { requireActiveUser } from "@/lib/account";
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
