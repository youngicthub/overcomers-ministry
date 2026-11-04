import { desc } from "drizzle-orm";
import { db, sermonsTable, insertSermonSchema } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { ensureSermonsSeeded } from "@/server/services/sermons";

export const GET = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  await ensureSermonsSeeded();
  const rows = await db.select().from(sermonsTable).orderBy(desc(sermonsTable.date));
  return json(rows);
});

export const POST = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = insertSermonSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);
  const [row] = await db.insert(sermonsTable).values(parsed.data).returning();
  return json(row, 201);
});
