"use server";

import { revalidatePath } from "next/cache";
import { auth, signOut } from "@/auth";
import { deleteMyAccount } from "@/lib/account";
import { blockUser } from "@/lib/blocks";
import { requestResultCorrection } from "@/lib/matches";

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

export type CorrectionState = { error: string | null; message: string | null };

export async function requestCorrectionAction(
  matchId: string,
  _prevState: CorrectionState,
  formData: FormData,
): Promise<CorrectionState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  const winnerId = String(formData.get("winnerId") ?? "");
  try {
    const result = await requestResultCorrection(session.user.id, matchId, winnerId);
    revalidatePath(`/players/${session.user.id}`);
    if (result.applied) {
      return { error: null, message: "Correction applied — ratings updated." };
    }
    if (result.disputed) {
      return {
        error: null,
        message: "Your correction doesn't match what your opponent submitted — a mod will review it.",
      };
    }
    return { error: null, message: "Submitted — waiting for your opponent to agree." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong — try again.", message: null };
  }
}
