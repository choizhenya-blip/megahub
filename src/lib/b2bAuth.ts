/**
 * B2B portal authentication helpers.
 * Uses HMAC-SHA256 for password hashing (consistent with admin auth).
 * Sessions stored in httpOnly cookies.
 */
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const SECRET = process.env.B2B_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? "b2b-secret-change-me";

/** Hash a password the same way as adminAuth */
export function hashB2bPassword(password: string): string {
  return createHmac("sha256", SECRET).update(`b2b:${password}`).digest("hex");
}

/** Verify a password against its hash */
export function verifyB2bPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  try {
    const inputHash = Buffer.from(hashB2bPassword(password), "hex");
    const storedHash = Buffer.from(hash, "hex");
    if (inputHash.length !== storedHash.length) return false;
    return timingSafeEqual(inputHash, storedHash);
  } catch {
    return false;
  }
}

/** Generate a cryptographically secure email verification token */
export function generateVerifyToken(): string {
  return randomBytes(32).toString("hex");
}

/** Generate a session token for a given B2B user id */
export function createB2bSessionToken(userId: string): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return createHmac("sha256", SECRET)
    .update(`b2b-session:${userId}:${day}`)
    .digest("hex");
}

/** Verify a B2B session token for a given user id (valid today or yesterday) */
export function verifyB2bSessionToken(token: string, userId: string): boolean {
  if (!token || token.length !== 64) return false;
  try {
    const buf = Buffer.from(token, "hex");
    for (let d = 0; d <= 1; d++) {
      const day = Math.floor(Date.now() / 86_400_000) - d;
      const expected = Buffer.from(
        createHmac("sha256", SECRET).update(`b2b-session:${userId}:${day}`).digest("hex"),
        "hex"
      );
      if (buf.length === expected.length && timingSafeEqual(buf, expected)) return true;
    }
  } catch { /* ignore */ }
  return false;
}
