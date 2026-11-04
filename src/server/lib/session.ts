import crypto from "node:crypto";
import { ConfigError } from "./config";

export const ADMIN_COOKIE = "media_admin_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export const adminCookieOptions = {
  httpOnly: true,
  // "strict": only sent on requests that originate from this site itself,
  // never as a side effect of following a link from somewhere else.
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// Sessions are stateless: the cookie carries the admin ID and an expiry,
// signed with HMAC-SHA256. Serverless functions share no memory, so the old
// in-memory session Map cannot work on Vercel. The admin row is still
// re-checked in the database on every request (see requireAdmin), so
// deleting an admin immediately ends their access.
function secretKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new ConfigError(
      "SESSION_SECRET is not configured (it must be a random string of at least 32 characters). " +
        "Add it in Vercel → Project → Settings → Environment Variables.",
    );
  }
  return crypto.createHmac("sha256", secret).update("overcomers/admin-session/v1").digest();
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secretKey()).update(payload).digest("base64url");
}

export function createSessionToken(adminId: string): string {
  const payload = Buffer.from(JSON.stringify({ a: adminId, e: Date.now() + SESSION_TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the admin ID inside a valid, unexpired token, or null. */
export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { a?: unknown; e?: unknown };
    if (typeof data.a !== "string" || typeof data.e !== "number" || data.e < Date.now()) return null;
    return data.a;
  } catch {
    return null;
  }
}
