"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { setAvoidPracticeOpponents, setHideOpponentRating, setRematchCooldown, setUsername } from "@/lib/account";
import { setArenaPassword } from "@/lib/arena";
import { setOwnCharacters } from "@/lib/character-stats";
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

export async function updateRematchCooldownSetting(rematchCooldownHours: number | null) {
  const userId = await requireUserId();
  await setRematchCooldown(userId, rematchCooldownHours);
  revalidatePath("/settings");
  revalidatePath("/lobby");
}

export async function updateAvoidPracticeOpponentsSetting(avoid: boolean) {
  const userId = await requireUserId();
  await setAvoidPracticeOpponents(userId, avoid);
  revalidatePath("/settings");
  revalidatePath("/lobby");
}

export async function updateHideOpponentRatingSetting(hide: boolean) {
  const userId = await requireUserId();
  await setHideOpponentRating(userId, hide);
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

export type OwnCharactersState = { error: string | null };

// (prevState, formData) shape so useActionState can drive it — the cap and
// main/secondary-overlap checks in setOwnCharacters throw, and a plain
// thrown error would otherwise crash to Next's generic error overlay.
export async function updateOwnCharacters(
  _prevState: OwnCharactersState,
  formData: FormData,
): Promise<OwnCharactersState> {
  const userId = await requireUserId();
  const mainCharacter = String(formData.get("mainCharacter") ?? "").trim() || null;
  const secondaryCharacters = formData
    .getAll("secondaryCharacters")
    .map((v) => String(v).trim())
    .filter(Boolean);
  try {
    await setOwnCharacters(userId, mainCharacter, secondaryCharacters);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong — try again." };
  }
  revalidatePath("/settings");
  revalidatePath(`/players/${userId}`);
  revalidatePath("/leaderboard");
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
