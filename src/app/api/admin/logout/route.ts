import { json, route } from "@/server/lib/http";
import { ADMIN_COOKIE, adminCookieOptions } from "@/server/lib/session";

export const POST = route(async () => {
  const response = json({ id: "admin-logout", message: "Admin session ended." });
  response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return response;
});
