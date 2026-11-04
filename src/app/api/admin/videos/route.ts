import { desc } from "drizzle-orm";
import { db, videosTable, insertVideoSchema } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { toPublicVideo } from "@/server/services/videos";

export const GET = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const rows = await db.select().from(videosTable).orderBy(desc(videosTable.createdAt));
  return json(rows.map(toPublicVideo));
});

export const POST = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = insertVideoSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);
  const [row] = await db.insert(videosTable).values(parsed.data).returning();
  return json(toPublicVideo(row), 201);
});
