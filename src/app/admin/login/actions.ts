"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminToken, verifyAdminToken } from "@/lib/adminAuth";
import { verifyAdminPasswordFromDB, changeAdminPassword } from "@/lib/adminAuthServer";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function signIn(formData: FormData) {
  const password = formData.get("password") as string;

  if (!await verifyAdminPasswordFromDB(password)) {
    redirect(`/admin/login?error=${encodeURIComponent("Неверный пароль")}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", createAdminToken(), {
    ...COOKIE_OPTS,
    maxAge: 60 * 60 * 24 * 2,
  });
  cookieStore.set("admin_last_active", String(Date.now()), {
    ...COOKIE_OPTS,
    maxAge: 16 * 60,
  });

  redirect("/admin");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  cookieStore.delete("admin_last_active");
  redirect("/admin/login");
}

export async function changePassword(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Новый пароль и подтверждение не совпадают" };
  }

  return changeAdminPassword(currentPassword, newPassword);
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  return verifyAdminToken(token ?? "");
}
