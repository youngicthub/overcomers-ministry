import { desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { articlesTable, db } from "@/server/db";
import { badRequest, json, PUBLIC_CACHE, route } from "@/server/lib/http";
import { ensureArticlesSeeded, toPublicArticle } from "@/server/services/articles";

const QueryParams = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

export const GET = route(async (req) => {
  const parsed = QueryParams.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error.message);

  await ensureArticlesSeeded();
  const rows = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.published, true))
    .orderBy(desc(articlesTable.createdAt));
  const search = parsed.data.search?.toLowerCase();
  const category = parsed.data.category?.toLowerCase();
  const filtered = rows.filter((article) => {
    const matchesSearch =
      !search ||
      article.title.toLowerCase().includes(search) ||
      article.excerpt.toLowerCase().includes(search) ||
      article.content.toLowerCase().includes(search);
    const matchesCategory = !category || article.category.toLowerCase() === category;
    return matchesSearch && matchesCategory;
  });
  return json(filtered.map(toPublicArticle), 200, PUBLIC_CACHE);
});
