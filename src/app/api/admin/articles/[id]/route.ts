import { eq } from "drizzle-orm";
import { db, articlesTable, insertArticleSchema } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { badRequest, json, parseId, readJson, routeWithParams } from "@/server/lib/http";

export const PATCH = routeWithParams<{ id: string }>(async (req, ctx) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const id = parseId((await ctx.params).id, "article");
  const parsed = insertArticleSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db
    .update(articlesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(articlesTable.id, id))
    .returning();
  if (!row) return json({ error: "Article not found" }, 404);
  return json(row);
});

export const DELETE = routeWithParams<{ id: string }>(async (req, ctx) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const id = parseId((await ctx.params).id, "article");
  const [row] = await db.delete(articlesTable).where(eq(articlesTable.id, id)).returning();
  if (!row) return json({ error: "Article not found" }, 404);
  return json({ deleted: true });
});
