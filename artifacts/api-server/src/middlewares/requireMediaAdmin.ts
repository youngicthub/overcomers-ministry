import type { RequestHandler } from "express";
import { adminCookie } from "../routes/admin";
import { getAdminForSession } from "../services/admin-state";

export const requireMediaAdmin: RequestHandler = async (req, res, next) => {
  const admin = await getAdminForSession(req.cookies?.[adminCookie]);
  if (!admin) {
    res.status(401).json({ error: "Media Admin session required" });
    return;
  }
  res.locals.mediaAdmin = admin;
  next();
};