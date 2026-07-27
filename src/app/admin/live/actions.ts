"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { postMatchCommentAsMod } from "@/lib/match-comments";

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
