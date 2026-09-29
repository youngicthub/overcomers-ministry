import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import rateLimit from "express-rate-limit";
import {
  accessTokenMatches,
  createAdmin,
  deleteAdminSession,
  getAdminForSession,
  getLockoutRemainingMs,
  verifyAdminPassword,
} from "../services/admin-state";
import { isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from "../lib/password";
import { handleDbError } from "../lib/db-error";

const router: IRouter = Router();
const adminCookie = "media_admin_session";
const cookieOptions = {
  httpOnly: true,
  // "strict" rather than "lax": this cookie should only ever be sent on
  // requests that originate from the admin's own navigation within this
  // site, never as a side effect of following a link from somewhere else.
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

// Sign-up and sign-in both get their own strict rate limit, keyed by IP,
// on top of the per-admin-ID lockout in admin-state.ts. This blunts
// distributed brute-force attempts that spread guesses across many admin
// IDs from the same source.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});

const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .refine(isPasswordStrongEnough, {
    message: "Password must include both letters and numbers.",
  });

// Creating a new admin identity requires the shared MEDIA_ADMIN_ACCESS_TOKEN
// (think of it as an invite code); signing back in afterwards only requires
// that individual admin's own password, not the shared token.
const SignupBody = z.object({
  accessToken: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  password: passwordSchema,
});

const LoginBody = z.object({
  adminId: z.string().trim().min(1),
  password: z.string().min(1),
});

router.post("/admin/signup", authLimiter, async (req, res) => {
  if (!process.env.MEDIA_ADMIN_ACCESS_TOKEN) {
    res.status(503).json({ error: "Media Admin access token is not configured" });
    return;
  }
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid sign-up details" });
    return;
  }
  if (!accessTokenMatches(parsed.data.accessToken)) {
    res.status(401).json({ error: "Invalid admin access token" });
    return;
  }
  const admin = await createAdmin({ name: parsed.data.name, password: parsed.data.password }).catch((err) => {
    handleDbError(req, res, err, "create the admin account");
    return null;
  });
  if (!admin) return;
  // Deliberately does NOT sign the new admin in automatically — they
  // confirm their own password works by logging in separately, and the
  // login path is the one that's rate-limited and lockout-protected.
  res.status(201).json({
    admin,
    message: "Account created. Save your Admin ID — you'll need it (with your password) to log in.",
  });
});

router.post("/admin/login", authLimiter, async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Admin ID and password are required" });
    return;
  }

  const remainingLockMs = getLockoutRemainingMs(parsed.data.adminId);
  if (remainingLockMs > 0) {
    res.status(429).json({
      error: `Too many failed attempts. Try again in ${Math.ceil(remainingLockMs / 60000)} minute(s).`,
    });
    return;
  }

  const result = await verifyAdminPassword(parsed.data.adminId, parsed.data.password).catch((err) => {
    handleDbError(req, res, err, "log you in");
    return null;
  });
  if (!result) return;
  if ("error" in result) {
    // Intentionally generic — never reveal whether the admin ID exists.
    res.status(401).json({ error: "Invalid admin ID or password" });
    return;
  }

  res.cookie(adminCookie, result.sessionId, cookieOptions);
  res.json({ authenticated: true, admin: result.admin });
});

router.get("/admin/session", async (req, res) => {
  const admin = await getAdminForSession(req.cookies?.[adminCookie]);
  if (!admin) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({ authenticated: true, admin });
});

router.post("/admin/logout", (req, res) => {
  deleteAdminSession(req.cookies?.[adminCookie]);
  res.clearCookie(adminCookie, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  res.json({ id: "admin-logout", message: "Admin session ended." });
});

export { adminCookie };
export default router;
