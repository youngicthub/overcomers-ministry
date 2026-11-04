import { json, route } from "@/server/lib/http";
import { getAdminForRequest } from "@/server/lib/admin-guard";

export const GET = route(async (req) => {
  const admin = await getAdminForRequest(req);
  if (!admin) return json({ authenticated: false }, 401);
  return json({ authenticated: true, admin });
});
