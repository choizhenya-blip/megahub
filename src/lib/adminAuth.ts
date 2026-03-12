import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "megahub-admin-secret-change-me";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

/** Token changes every day — valid for today and yesterday (timezone buffer) */
function tokenForDay(offsetDays = 0): string {
  const day = Math.floor(Date.now() / 86_400_000) - offsetDays;
  return createHmac("sha256", SECRET)
    .update(`megahub-admin:${day}`)
    .digest("hex");
}

export function createAdminToken(): string {
  return tokenForDay(0);
}

export function verifyAdminToken(token: string): boolean {
  if (!token || token.length !== 64) return false;
  try {
    const buf = Buffer.from(token, "hex");
    for (let d = 0; d <= 1; d++) {
      const expected = Buffer.from(tokenForDay(d), "hex");
      if (buf.length === expected.length && timingSafeEqual(buf, expected)) {
        return true;
      }
    }
  } catch {
    // invalid hex etc.
  }
  return false;
}

export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}
