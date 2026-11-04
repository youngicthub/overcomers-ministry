import { desc } from "drizzle-orm";
import { z } from "zod/v4";
import { db, videosTable } from "@/server/db";
import { badRequest, json, PUBLIC_CACHE, route } from "@/server/lib/http";
import { toPublicVideo } from "@/server/services/videos";

const QueryParams = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

export const GET = route(async (req) => {
  const parsed = QueryParams.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error.message);

  const rows = await db.select().from(videosTable).orderBy(desc(videosTable.createdAt));
  const search = parsed.data.search?.toLowerCase();
  const category = parsed.data.category?.toLowerCase();
  const filtered = rows.filter((video) => {
    const matchesSearch =
      !search ||
      video.title.toLowerCase().includes(search) ||
      (video.description ?? "").toLowerCase().includes(search);
    const matchesCategory = !category || (video.category ?? "").toLowerCase() === category;
    return matchesSearch && matchesCategory;
  });
  return json(filtered.map(toPublicVideo), 200, PUBLIC_CACHE);
});
