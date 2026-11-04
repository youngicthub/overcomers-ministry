import { json, route } from "@/server/lib/http";
import { requireAdmin } from "@/server/lib/admin-guard";
import { listAdmins } from "@/server/services/admin-state";

export const GET = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;
  return json(await listAdmins());
});
