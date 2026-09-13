import { Router, type IRouter } from "express";
import {
  RequestAdminOtpBody,
  RequestAdminOtpResponse,
  VerifyAdminOtpBody,
  VerifyAdminOtpResponse,
  GetAdminSessionResponse,
  LogoutAdminResponse,
} from "@workspace/api-zod";
import {
  accessTokenMatches,
  deleteAdminSession,
  getAdminForSession,
  requestAdminOtp,
  verifyAdminOtp,
} from "../services/admin-state";

const router: IRouter = Router();
const adminCookie = "media_admin_session";
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

router.post("/admin/otp/request", async (req, res) => {
  if (!process.env.MEDIA_ADMIN_ACCESS_TOKEN) {
    res.status(503).json({ error: "Media Admin access token is not configured" });
    return;
  }
  const parsed = RequestAdminOtpBody.safeParse(req.body);
  if (!parsed.success || !accessTokenMatches(parsed.data?.accessToken)) {
    res.status(401).json({ error: "Invalid admin access token" });
    return;
  }
  const result = await requestAdminOtp(parsed.data);
  if ("error" in result) {
    res.status(404).json({ error: result.error });
    return;
  }
  res.json(RequestAdminOtpResponse.parse(result));
});

router.post("/admin/otp/verify", async (req, res) => {
  const parsed = VerifyAdminOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const result = await verifyAdminOtp(parsed.data.challengeId, parsed.data.otp);
  if (!result) {
    res.status(401).json({ error: "Invalid or expired OTP" });
    return;
  }
  res.cookie(adminCookie, result.sessionId, cookieOptions);
  res.json(VerifyAdminOtpResponse.parse({ authenticated: true, admin: result.admin }));
});

router.get("/admin/session", async (req, res) => {
  const admin = await getAdminForSession(req.cookies?.[adminCookie]);
  if (!admin) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json(GetAdminSessionResponse.parse({ authenticated: true, admin }));
});

router.post("/admin/logout", (req, res) => {
  deleteAdminSession(req.cookies?.[adminCookie]);
  res.clearCookie(adminCookie, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  res.json(LogoutAdminResponse.parse({ id: "admin-logout", message: "Admin session ended." }));
});

export { adminCookie };
export default router;