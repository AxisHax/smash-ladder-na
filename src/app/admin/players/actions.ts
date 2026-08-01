"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

async function requireModerator() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (session.user.role !== "MOD" && session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
}

export async function setSupporter(userId: string, isSupporter: boolean) {
  await requireModerator();
  await prisma.user.update({ where: { id: userId }, data: { isSupporter } });
  revalidatePath("/admin/players");
}
