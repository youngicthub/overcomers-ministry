import { z } from "zod/v4";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { limitByIp } from "@/server/lib/rate-limit";
import { isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from "@/server/lib/password";
import { accessTokenMatches, createAdmin } from "@/server/services/admin-state";

const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .refine(isPasswordStrongEnough, { message: "Password must include both letters and numbers." });

// Creating a new admin identity requires the shared MEDIA_ADMIN_ACCESS_TOKEN
// (think of it as an invite code); signing back in afterwards only requires
// that individual admin's own password, not the shared token.
const SignupBody = z.object({
  accessToken: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  password: passwordSchema,
});

export const POST = route(async (req) => {
  const limited = await limitByIp(req, "auth", 10, 15 * 60 * 1000, "Too many attempts. Please wait a few minutes and try again.");
  if (limited) return limited;

  if (!process.env.MEDIA_ADMIN_ACCESS_TOKEN) {
    return json({ error: "Media Admin access token is not configured" }, 503);
  }
  const parsed = SignupBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid sign-up details");
  if (!accessTokenMatches(parsed.data.accessToken)) return json({ error: "Invalid admin access token" }, 401);

  const admin = await createAdmin({ name: parsed.data.name, password: parsed.data.password });
  // Deliberately does NOT sign the new admin in automatically — they confirm
  // their own password works by logging in, which is the rate-limited and
  // lockout-protected path.
  return json(
    { admin, message: "Account created. Save your Admin ID — you'll need it (with your password) to log in." },
    201,
  );
});
