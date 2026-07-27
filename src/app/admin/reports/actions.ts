"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { actionReport, dismissReport, moderateUserDirectly } from "@/lib/reports";

async function requireModerator() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (session.user.role !== "MOD" && session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  return session.user.id;
}

export async function dismiss(reportId: string) {
  await requireModerator();
  await dismissReport(reportId);
  revalidatePath("/admin/reports");
}

export async function suspendReportedUser(reportId: string, formData: FormData) {
  await requireModerator();
  const suspensionHours = parseSuspensionHours(formData.get("suspensionHours"));
  const skipThreshold = formData.get("insta") === "on";
  await actionReport(reportId, "SUSPENDED", { suspensionHours, skipThreshold });
  revalidatePath("/admin/reports");
}

export async function banReportedUser(reportId: string, formData: FormData) {
  await requireModerator();
  const skipThreshold = formData.get("insta") === "on";
  await actionReport(reportId, "BANNED", { skipThreshold });
  revalidatePath("/admin/reports");
}

function parseSuspensionHours(raw: FormDataEntryValue | null) {
  if (raw === "indefinite" || raw === null) return null;
  const hours = Number(raw);
  return Number.isFinite(hours) ? hours : null;
}

export async function reinstateUser(userId: string) {
  const modId = await requireModerator();
  await moderateUserDirectly(modId, userId, "REINSTATE");
  revalidatePath("/admin/reports");
}
