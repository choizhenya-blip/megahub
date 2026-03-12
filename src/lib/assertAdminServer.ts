import { cookies } from "next/headers";
import { verifyAdminToken } from "./adminAuth";

/** Use in API route handlers to check admin session cookie */
export async function assertAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value ?? "";
  return verifyAdminToken(token);
}
