import type { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, readSessionToken } from "./session";
import { isTrustedOrigin } from "./origin";
import { json } from "./http";
import { findAdmin, type AdminRecord } from "../services/admin-state";

/** The signed-in Media Admin for this request, or null. The signature is
 * checked first (cheap, no database); the admin row is then re-checked so a
 * deleted admin loses access immediately. */
export async function getAdminForRequest(req: NextRequest): Promise<AdminRecord | null> {
  const adminId = readSessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
  return adminId ? findAdmin(adminId) : null;
}

type Guard = { admin: AdminRecord } | { response: NextResponse };

// Two independent checks gate every admin-only route:
//  1. A valid, unexpired, signed session cookie (real authentication).
//  2. For state-changing requests, the Origin/Referer must be this site
//     (CSRF defense-in-depth on top of the SameSite=Strict cookie).
// Usage:  const auth = await requireAdmin(req);
//         if ("response" in auth) return auth.response;
export async function requireAdmin(req: NextRequest): Promise<Guard> {
  const isStateChanging = req.method !== "GET" && req.method !== "HEAD";
  if (isStateChanging && !isTrustedOrigin(req)) {
    return { response: json({ error: "Request origin not allowed" }, 403) };
  }
  const admin = await getAdminForRequest(req);
  if (!admin) {
    return { response: json({ error: "Media Admin session required" }, 401) };
  }
  return { admin };
}
