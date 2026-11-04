import { desc } from "drizzle-orm";
import { db, prayerRequestsTable } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { json, route } from "@/server/lib/http";

export const GET = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const rows = await db.select().from(prayerRequestsTable).orderBy(desc(prayerRequestsTable.createdAt));
  return json(rows);
});
