import { z } from "zod/v4";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { limitByIp } from "@/server/lib/rate-limit";
import { ADMIN_COOKIE, adminCookieOptions, createSessionToken, SESSION_TTL_MS } from "@/server/lib/session";
import { getLockoutRemainingMs, verifyAdminPassword } from "@/server/services/admin-state";

const LoginBody = z.object({
  adminId: z.string().trim().min(1),
  password: z.string().min(1),
});

export const POST = route(async (req) => {
  const limited = await limitByIp(req, "auth", 10, 15 * 60 * 1000, "Too many attempts. Please wait a few minutes and try again.");
  if (limited) return limited;

  const parsed = LoginBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Admin ID and password are required");

  const remainingLockMs = await getLockoutRemainingMs(parsed.data.adminId);
  if (remainingLockMs > 0) {
    return json({ error: `Too many failed attempts. Try again in ${Math.ceil(remainingLockMs / 60000)} minute(s).` }, 429);
  }

  const result = await verifyAdminPassword(parsed.data.adminId, parsed.data.password);
  if ("error" in result) {
    // Intentionally generic — never reveal whether the admin ID exists.
    return json({ error: "Invalid admin ID or password" }, 401);
  }

  const response = json({ authenticated: true, admin: result.admin });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(result.admin.id), {
    ...adminCookieOptions,
    maxAge: SESSION_TTL_MS / 1000,
  });
  return response;
});
