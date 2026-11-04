import { desc } from "drizzle-orm";
import { db, articlesTable, insertArticleSchema } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { ensureArticlesSeeded } from "@/server/services/articles";

export const GET = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  await ensureArticlesSeeded();
  const rows = await db.select().from(articlesTable).orderBy(desc(articlesTable.createdAt));
  return json(rows);
});

export const POST = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = insertArticleSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);
  const [row] = await db.insert(articlesTable).values(parsed.data).returning();
  return json(row, 201);
});
