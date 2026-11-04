import { db, articlesTable, type Article } from "../db";
import { seedOnce } from "./kv";

const DEFAULT_ARTICLES = [
  {
    title: "What It Means to Live as an Overcomer",
    excerpt:
      "Overcoming is not pretending the storm is small. It is learning where to stand when the storm arrives.",
    content:
      "Overcoming is not pretending the storm is small. It is learning where to stand when the storm arrives.\n\n" +
      "Every believer eventually meets a season that tests what they actually believe, not just what they say they believe. Scripture never promises us a storm-free life; it promises us a steady place to stand inside the storm.\n\n" +
      "That place is Christ. Not our strength, not our understanding of what is happening, not even our feelings about the outcome — Christ Himself, who has already overcome the world. When we plant our feet there, the storm remains real, but it stops being the loudest voice in the room.",
    category: "Faith",
    author: "Pastor David Akinyemi",
    coverImageUrl: null,
    published: true,
  },
  {
    title: "A Table Ready for You",
    excerpt:
      "There is a place for your story, your questions, and your becoming in the family of God.",
    content:
      "There is a place for your story, your questions, and your becoming in the family of God.\n\n" +
      "So often we wait at the edge of community, assuming we need to be finished, healed, or certain before we are welcome. But the table was set long before we arrived polished — it was set for people still in process.\n\n" +
      "Come as you are. Bring your questions. Bring the parts of your story you are still making sense of. There is room here for all of it, and for you.",
    category: "Belonging",
    author: "Ruth Adeoye",
    coverImageUrl: null,
    published: true,
  },
  {
    title: "Small Prayers, Faithful Days",
    excerpt:
      "A simple practice for staying close to God when life feels full and your attention feels divided.",
    content:
      "A simple practice for staying close to God when life feels full and your attention feels divided.\n\n" +
      "You do not need an unbroken hour of silence to meet with God. A short, honest sentence prayed between tasks — in traffic, over the sink, before a hard conversation — keeps your heart tethered to Him through an ordinary day.\n\n" +
      "Try it this week: three small prayers a day, no longer than a breath. Watch how much closer the day feels.",
    category: "Devotional",
    author: "Tomiwa Adebayo",
    coverImageUrl: null,
    published: true,
  },
];

// Mirrors ensureSermonsSeeded: seed once so the public Articles page isn't
// empty on day one. Admins can edit, unpublish, or delete these afterwards.
export function ensureArticlesSeeded() {
  return seedOnce("articles", async () => {
    const existing = await db.select({ id: articlesTable.id }).from(articlesTable).limit(1);
    if (existing.length === 0) {
      await db.insert(articlesTable).values(DEFAULT_ARTICLES);
    }
  });
}

/** Roughly estimates reading time from word count (~200 words/minute), so
 * admins never have to fill in a "read time" field by hand. */
export function estimateReadTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

export function toPublicArticle(row: Article) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    author: row.author,
    coverImageUrl: row.coverImageUrl,
    date: row.createdAt.toISOString().slice(0, 10),
    readTime: estimateReadTime(row.content),
  };
}
