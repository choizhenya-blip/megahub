import { NextRequest, NextResponse } from "next/server";

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes — must match AdminHeader.tsx
const enc = new TextEncoder();

/** Edge-compatible HMAC-SHA256 verification using Web Crypto API */
async function verifyToken(token: string): Promise<boolean> {
  if (!token || token.length !== 64) return false;

  const secret =
    process.env.ADMIN_SESSION_SECRET ?? "megahub-admin-secret-change-me";
  const day = Math.floor(Date.now() / 86_400_000);

  for (let d = 0; d <= 1; d++) {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(`megahub-admin:${day - d}`),
    );
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < 64; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
    }
    if (diff === 0) return true;
  }
  return false;
}

function setCookieOnResponse(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
) {
  response.cookies.set(name, value, {
    httpOnly: true,
    // Allow localhost testing: only require secure in production HTTPS context
    secure: process.env.NODE_ENV === "production" &&
      !process.env.ALLOW_HTTP_COOKIES,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_session")?.value ?? "";
  const lastActiveCookie = request.cookies.get("admin_last_active")?.value ?? "";

  // ── Protected admin routes ────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {

    // 1. Token must be cryptographically valid
    if (!await verifyToken(token)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }

    const lastActive = Number(lastActiveCookie);
    const elapsed = lastActive ? Date.now() - lastActive : Infinity;

    // 2a. Fresh login or missing cookie — token is valid, initialise last_active
    //     (covers first request after signIn redirect, or cookie lost after deploy)
    if (!lastActive) {
      const response = NextResponse.next({ request });
      setCookieOnResponse(response, "admin_last_active", String(Date.now()), 16 * 60);
      return response;
    }

    // 2b. Inactivity timeout exceeded
    if (elapsed > INACTIVITY_MS) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("error", encodeURIComponent("Сессия истекла — войдите снова"));
      const res = NextResponse.redirect(url);
      res.cookies.delete("admin_session");
      res.cookies.delete("admin_last_active");
      return res;
    }

    // 3. All good — slide the activity window
    const response = NextResponse.next({ request });
    setCookieOnResponse(response, "admin_last_active", String(Date.now()), 16 * 60);
    return response;
  }

  // ── Login page — skip to /admin if already active ─────────────────────────
  if (pathname === "/admin/login") {
    const lastActive = Number(lastActiveCookie);
    const isActive =
      !!lastActive &&
      Date.now() - lastActive <= INACTIVITY_MS &&
      (await verifyToken(token));
    if (isActive) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin/:path*"],
};
