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

export type BlockState = { error: string | null };

// (prevState, formData) shape so useActionState can drive it — hitting the
// block-count cap throws, and a plain thrown error would otherwise crash to
// Next's generic error overlay instead of showing an inline message.
export async function blockUserAction(
  blockedId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's call signature
  _prevState: BlockState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's call signature
  _formData: FormData,
): Promise<BlockState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  try {
    await blockUser(session.user.id, blockedId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong — try again." };
  }
  revalidatePath(`/players/${blockedId}`);
  revalidatePath("/settings");
  return { error: null };
}

export async function unblockUserAction(blockedId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  await unblockUser(session.user.id, blockedId);
  revalidatePath(`/players/${blockedId}`);
  revalidatePath("/settings");
}
