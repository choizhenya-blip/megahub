"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminToken, verifyAdminToken, verifyAdminPassword } from "@/lib/adminAuth";

export async function signIn(formData: FormData) {
  const password = formData.get("password") as string;

  if (!verifyAdminPassword(password)) {
    redirect(`/admin/login?error=${encodeURIComponent("Неверный пароль")}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", createAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 2, // 2 days
    path: "/",
  });

  redirect("/admin");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}

// Keep for backward compat (unused)
export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  return verifyAdminToken(token ?? "");
}
