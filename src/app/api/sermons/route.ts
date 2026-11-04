import { desc } from "drizzle-orm";
import { z } from "zod/v4";
import { db, sermonsTable } from "@/server/db";
import { badRequest, json, PUBLIC_CACHE, route } from "@/server/lib/http";
import { ensureSermonsSeeded } from "@/server/services/sermons";

const QueryParams = z.object({
  search: z.string().optional(),
  series: z.string().optional(),
});

export const GET = route(async (req) => {
  const parsed = QueryParams.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error.message);

  await ensureSermonsSeeded();
  const allSermons = await db.select().from(sermonsTable).orderBy(desc(sermonsTable.date));
  const search = parsed.data.search?.toLowerCase();
  const series = parsed.data.series?.toLowerCase();
  const filtered = allSermons.filter((sermon) => {
    const matchesSearch =
      !search ||
      sermon.title.toLowerCase().includes(search) ||
      sermon.speaker.toLowerCase().includes(search) ||
      sermon.description.toLowerCase().includes(search);
    const matchesSeries = !series || sermon.series.toLowerCase() === series;
    return matchesSearch && matchesSeries;
  });
  return json(filtered, 200, PUBLIC_CACHE);
});
