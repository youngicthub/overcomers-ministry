import { eq } from "drizzle-orm";
import { articlesTable, db } from "@/server/db";
import { json, parseId, PUBLIC_CACHE, routeWithParams } from "@/server/lib/http";
import { toPublicArticle } from "@/server/services/articles";

export const GET = routeWithParams<{ id: string }>(async (_req, ctx) => {
  const id = parseId((await ctx.params).id, "article");
  const [row] = await db.select().from(articlesTable).where(eq(articlesTable.id, id)).limit(1);
  if (!row || !row.published) return json({ error: "Article not found" }, 404);
  return json(toPublicArticle(row), 200, PUBLIC_CACHE);
});
