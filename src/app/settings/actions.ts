"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setAudioPingOnMatch, setAvoidPracticeOpponents, setUsername } from "@/lib/account";
import { setArenaPassword } from "@/lib/arena";
import { disconnectStartggAccount } from "@/lib/startgg-oauth";
import { disconnectTwitchAccount } from "@/lib/twitch-oauth";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  return session.user.id;
}

export type UpdateUsernameState = { error: string | null; message: string | null };

export async function updateUsernameAction(
  _prevState: UpdateUsernameState,
  formData: FormData,
): Promise<UpdateUsernameState> {
  const userId = await requireUserId();
  try {
    await setUsername(userId, String(formData.get("username") ?? ""));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong — try again.", message: null };
  }
  // "layout" here, not just the default "page" — the header showing this
  // player's name lives in the root layout, which a page-level revalidation
  // doesn't touch, so the old name would otherwise stick around in the
  // header (though not the page content) until the next full navigation.
  revalidatePath("/", "layout");
  revalidatePath(`/players/${userId}`);
  revalidatePath("/leaderboard");
  return { error: null, message: "Saved." };
}

export async function updateAvoidPracticeOpponentsSetting(avoid: boolean) {
  const userId = await requireUserId();
  await setAvoidPracticeOpponents(userId, avoid);
  revalidatePath("/settings");
  revalidatePath("/lobby");
}

export async function updateAudioPingOnMatchSetting(enabled: boolean) {
  const userId = await requireUserId();
  await setAudioPingOnMatch(userId, enabled);
  revalidatePath("/settings");
  revalidatePath("/lobby");
}

export type ArenaPasswordState = { error: string | null };

// (prevState, formData) shape so useActionState can drive it — hitting the
// length limit throws, and a plain thrown error would otherwise crash to
// Next's generic error overlay instead of showing an inline message.
export async function updateArenaPassword(
  _prevState: ArenaPasswordState,
  formData: FormData,
): Promise<ArenaPasswordState> {
  const userId = await requireUserId();
  try {
    await setArenaPassword(userId, String(formData.get("arenaPassword") ?? ""));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong — try again." };
  }
  revalidatePath("/settings");
  revalidatePath("/lobby");
  return { error: null };
}

export async function disconnectStartggAction() {
  const userId = await requireUserId();
  await disconnectStartggAccount(userId);
  revalidatePath("/settings");
  revalidatePath(`/players/${userId}`);
}

export async function disconnectTwitchAction() {
  const userId = await requireUserId();
  await disconnectTwitchAccount(userId);
  revalidatePath("/settings");
  revalidatePath(`/players/${userId}`);
}
