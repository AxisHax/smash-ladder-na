"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { deleteMyAccount } from "@/lib/account";
import { blockUser, unblockUser } from "@/lib/blocks";

export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  await deleteMyAccount(session.user.id);
  await signOut({ redirectTo: "/" });
}

export async function blockUserAction(blockedId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  await blockUser(session.user.id, blockedId);
  revalidatePath(`/players/${blockedId}`);
  revalidatePath("/settings");
}

export async function unblockUserAction(blockedId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  await unblockUser(session.user.id, blockedId);
  revalidatePath(`/players/${blockedId}`);
  revalidatePath("/settings");
}
