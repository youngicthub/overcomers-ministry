import type { RequestHandler } from "express";
import { adminCookie } from "../routes/admin";
import { getAdminForSession } from "../services/admin-state";
import { isTrustedOrigin } from "../lib/origin";

// Two independent checks gate every admin-only route:
//  1. A valid, unexpired session cookie (real authentication).
//  2. The request's Origin/Referer must match our own configured
//     frontend origin (CSRF defense-in-depth). Cookies alone are not
//     enough: a malicious site could still get a logged-in admin's
//     browser to fire a cross-site POST carrying that cookie. SameSite=
//     strict on the cookie already blocks most of this, but browsers,
//     proxies, and older clients vary, so we check explicitly too rather
//     than relying on one layer alone.
export const requireMediaAdmin: RequestHandler = async (req, res, next) => {
  const isStateChanging = req.method !== "GET" && req.method !== "HEAD";
  if (isStateChanging && !isTrustedOrigin(req)) {
    res.status(403).json({ error: "Request origin not allowed" });
    return;
  }

  const admin = await getAdminForSession(req.cookies?.[adminCookie]);
  if (!admin) {
    res.status(401).json({ error: "Media Admin session required" });
    return;
  }
  res.locals.mediaAdmin = admin;
  next();
};
