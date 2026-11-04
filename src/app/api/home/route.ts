import { desc, eq } from "drizzle-orm";
import { articlesTable, db, sermonsTable, videosTable } from "@/server/db";
import { events } from "@/server/content";
import { json, route } from "@/server/lib/http";
import { ensureArticlesSeeded, toPublicArticle } from "@/server/services/articles";
import { getTodaysDevotional } from "@/server/services/devotionals";
import { getLiveStatus } from "@/server/services/live-state";
import { ensureSermonsSeeded } from "@/server/services/sermons";
import { toPublicVideo } from "@/server/services/videos";

export const GET = route(async () => {
  await Promise.all([ensureSermonsSeeded(), ensureArticlesSeeded()]);
  const [recentSermons, [latestArticle], recentVideos, live] = await Promise.all([
    db.select().from(sermonsTable).orderBy(desc(sermonsTable.date)).limit(3),
    db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.published, true))
      .orderBy(desc(articlesTable.createdAt))
      .limit(1),
    db.select().from(videosTable).orderBy(desc(videosTable.createdAt)).limit(3),
    getLiveStatus(),
  ]);
  // Not edge-cached: it carries the live-broadcast banner, which must flip
  // as soon as a broadcast starts or stops.
  return json({
    devotional: getTodaysDevotional(),
    events: events.slice(0, 3),
    sermons: recentSermons,
    article: latestArticle ? toPublicArticle(latestArticle) : null,
    videos: recentVideos.map(toPublicVideo),
    live,
  });
});
