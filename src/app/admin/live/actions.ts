"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { postMatchCommentAsMod } from "@/lib/match-comments";
import { adminForceConfirmMatch } from "@/lib/matches";

async function requireModerator() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (session.user.role !== "MOD" && session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  return session.user.id;
}

export async function postLiveMatchComment(matchId: string, formData: FormData) {
  const modId = await requireModerator();
  const body = String(formData.get("body") ?? "");
  await postMatchCommentAsMod(modId, matchId, body);
  revalidatePath("/admin/live");
}

export type ForceConfirmState = { error: string | null };

// (matchId, winnerId, prevState, formData) shape so useActionState can
// drive it — a plain thrown error (match already closed, bad winnerId)
// would otherwise crash to Next's generic error overlay.
export async function forceConfirmMatchAction(
  matchId: string,
  winnerId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's call signature
  _prevState: ForceConfirmState,
): Promise<ForceConfirmState> {
  await requireModerator();
  try {
    await adminForceConfirmMatch(matchId, winnerId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong — try again." };
  }
  revalidatePath("/admin/live");
  return { error: null };
}
