import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { desc, eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import {
  db,
  prayerRequestsTable,
  insertPrayerRequestSchema,
  membersTable,
  insertMemberSchema,
  consultationsTable,
  insertConsultationSchema,
  contactMessagesTable,
  insertContactMessageSchema,
  sermonsTable,
  articlesTable,
  videosTable,
} from "../db";
import { liveStatus } from "../services/live-state";
import { ensureSermonsSeeded } from "../services/sermons";
import { ensureArticlesSeeded, estimateReadTime } from "../services/articles";
import { toPublicVideo } from "../services/videos";
import { getTodaysDevotional } from "../services/devotionals";

const router: IRouter = Router();

// Public submission forms have no login to rate-limit by account, so
// they're limited by IP instead — generous enough for a real visitor
// submitting a form a few times, tight enough to blunt scripted spam.
const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this connection. Please try again later." },
});

const ministries = [
  {
    id: "choir",
    name: "Worship & Choir",
    description: "Creating room for people to encounter God through sincere, joyful worship.",
    accent: "01",
  },
  {
    id: "children",
    name: "Children's Church",
    description: "Helping the next generation grow in faith, confidence, and a love for Jesus.",
    accent: "02",
  },
  {
    id: "media",
    name: "Media & Broadcast",
    description: "Carrying the message beyond our walls with excellence, creativity, and care.",
    accent: "03",
  },
  {
    id: "evangelism",
    name: "Evangelism",
    description: "Taking the good news into our communities through practical love and bold faith.",
    accent: "04",
  },
  {
    id: "prayer",
    name: "Prayer Ministry",
    description: "Standing together in prayer for healing, direction, restoration, and breakthrough.",
    accent: "05",
  },
  {
    id: "protocol",
    name: "Protocol & Ushering",
    description: "Making every person feel seen, welcomed, and at home from their first visit.",
    accent: "06",
  },
];

const events = [
  {
    id: 1,
    title: "Sunday Celebration Service",
    description: "A joyful gathering for worship, the Word, and a fresh start to the week.",
    location: "Main Auditorium",
    date: "2026-09-13",
    time: "8:00 AM & 10:00 AM",
    category: "Worship",
  },
  {
    id: 2,
    title: "Midweek Encounter",
    description: "A focused evening of teaching and prayer for the journey ahead.",
    location: "Faith Centre",
    date: "2026-09-16",
    time: "6:00 PM",
    category: "Teaching",
  },
  {
    id: 3,
    title: "Community Outreach Day",
    description: "Serving our neighbours with food, prayer, and practical support.",
    location: "Lagos Mainland",
    date: "2026-09-26",
    time: "9:00 AM",
    category: "Outreach",
  },
];

const testimonies = [
  {
    id: 1,
    name: "Adaeze",
    content:
      "I walked into Overcomers carrying a question and found a family willing to walk with me. Six months later, my faith is alive again.",
    location: "Lagos",
  },
  {
    id: 2,
    name: "Michael",
    content:
      "The prayer ministry stood with my family through a difficult season. We experienced peace before we saw the answer, and that changed everything.",
    location: "Ikeja",
  },
  {
    id: 3,
    name: "Bunmi",
    content:
      "I came for a service, stayed for the people, and discovered a place where I can serve with joy. Overcomers has become home.",
    location: "Yaba",
  },
];

const receipt = (message: string, id?: string | number) => ({
  id: id !== undefined ? String(id) : `submission-${Date.now()}`,
  message,
});

function toPublicArticle(row: typeof articlesTable.$inferSelect) {
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

router.get("/home", async (_req, res) => {
  await ensureSermonsSeeded();
  await ensureArticlesSeeded();
  const recentSermons = await db
    .select()
    .from(sermonsTable)
    .orderBy(desc(sermonsTable.date))
    .limit(3);
  const [latestArticle] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.published, true))
    .orderBy(desc(articlesTable.createdAt))
    .limit(1);
  const recentVideos = (
    await db.select().from(videosTable).orderBy(desc(videosTable.createdAt)).limit(3)
  ).map(toPublicVideo);
  res.json({
    devotional: getTodaysDevotional(),
    events: events.slice(0, 3),
    sermons: recentSermons,
    article: latestArticle ? toPublicArticle(latestArticle) : null,
    videos: recentVideos,
    live: liveStatus,
  });
});

router.get("/ministries", (_req, res) => {
  res.json(ministries);
});

router.get("/events", (_req, res) => {
  res.json(events);
});

const ListSermonsQueryParams = z.object({
  search: z.string().optional(),
  series: z.string().optional(),
});

router.get("/sermons", async (req, res) => {
  const parsed = ListSermonsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
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
  res.json(filtered);
});

const ListArticlesQueryParams = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

router.get(["/articles", "/blogs"], async (req, res) => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
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
  res.json(filtered.map(toPublicArticle));
});

router.get("/articles/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid article id" });
    return;
  }
  const [row] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, id))
    .limit(1);
  if (!row || !row.published) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(toPublicArticle(row));
});

const ListVideosQueryParams = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

router.get("/videos", async (req, res) => {
  const parsed = ListVideosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
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
  res.json(filtered.map(toPublicVideo));
});

router.get("/devotionals/today", (_req, res) => {
  res.json(getTodaysDevotional());
});

router.get("/testimonies", (_req, res) => {
  res.json(testimonies);
});

router.get("/live", (_req, res) => {
  res.json(liveStatus);
});

router.post("/prayers", formLimiter, async (req, res) => {
  const parsed = insertPrayerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(prayerRequestsTable)
      .values({
        name: parsed.data.name || null,
        request: parsed.data.request,
        anonymous: parsed.data.anonymous,
      })
      .returning();
    res
      .status(201)
      .json(receipt("Your prayer request has been received. We will stand with you in prayer.", row.id));
  } catch (err) {
    req.log?.error({ err }, "Failed to save prayer request");
    res.status(500).json({ error: "We could not save your prayer request. Please try again." });
  }
});

router.post("/members", formLimiter, async (req, res) => {
  const parsed = insertMemberSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(membersTable)
      .values({ ...parsed.data, birthday: parsed.data.birthday || null })
      .returning();
    res.status(201).json(receipt("Welcome to the family. Our team will be in touch soon.", row.id));
  } catch (err) {
    req.log?.error({ err }, "Failed to save member registration");
    res.status(500).json({ error: "We could not save your registration. Please try again." });
  }
});

router.post("/consultations", formLimiter, async (req, res) => {
  const parsed = insertConsultationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db.insert(consultationsTable).values(parsed.data).returning();
    res.status(201).json(receipt("Your consultation request is safely with our care team.", row.id));
  } catch (err) {
    req.log?.error({ err }, "Failed to save consultation request");
    res.status(500).json({ error: "We could not save your request. Please try again." });
  }
});

router.post("/contacts", formLimiter, async (req, res) => {
  const parsed = insertContactMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db.insert(contactMessagesTable).values(parsed.data).returning();
    res.status(201).json(receipt("Thanks for reaching out. We will respond as soon as possible.", row.id));
  } catch (err) {
    req.log?.error({ err }, "Failed to save contact message");
    res.status(500).json({ error: "We could not send your message. Please try again." });
  }
});

export default router;
