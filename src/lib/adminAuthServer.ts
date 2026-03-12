/**
 * Server-only admin auth helpers (Node.js runtime, DB access).
 * Do NOT import in middleware.ts or other Edge-runtime files.
 */
import { timingSafeEqual } from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { hashPassword, verifyAdminPassword } from "@/lib/adminAuth";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Verify a password.
 *
 * Priority order:
 *   1. ADMIN_PASSWORD env var (the original password — always tried first)
 *   2. admin_settings.admin_password_hash in DB (set when user changes password via admin UI)
 *
 * This means the original env-var password always works even if the DB is unreachable.
 * After a password change, the new password works via DB lookup.
 */
export async function verifyAdminPasswordFromDB(password: string): Promise<boolean> {
  if (!password) return false;

  // ── 1. Env var check (primary, fast, always available) ──────────────────
  if (verifyAdminPassword(password)) return true;

  // ── 2. DB hash check (only if password was changed via admin UI) ─────────
  try {
    const db = createSupabaseServiceClient();
    const { data } = await db
      .from("admin_settings")
      .select("value")
      .eq("key", "admin_password_hash")
      .maybeSingle(); // maybeSingle → data=null when no row, never throws PGRST116

    if (data?.value) {
      const inputHash = Buffer.from(hashPassword(password), "hex");
      const storedHash = Buffer.from(data.value, "hex");
      if (inputHash.length === storedHash.length) {
        return timingSafeEqual(inputHash, storedHash);
      }
      return false;
    }
  } catch {
    // DB unavailable — env var was already checked above
  }

  return false;
}

/**
 * Change the admin password.
 * Saves a HMAC-SHA256 hash to admin_settings so it persists without redeployment.
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!currentPassword || !newPassword) {
    return { ok: false, error: "Заполните все поля" };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Новый пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов`,
    };
  }

  const valid = await verifyAdminPasswordFromDB(currentPassword);
  if (!valid) {
    return { ok: false, error: "Текущий пароль неверен" };
  }

  const db = createSupabaseServiceClient();
  const { error } = await db
    .from("admin_settings")
    .upsert({ key: "admin_password_hash", value: hashPassword(newPassword) });

  if (error) {
    return { ok: false, error: "Ошибка сохранения: " + error.message };
  }
  return { ok: true };
}
