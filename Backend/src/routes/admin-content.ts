import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  sermonsTable,
  insertSermonSchema,
  articlesTable,
  insertArticleSchema,
  videosTable,
  insertVideoSchema,
  prayerRequestsTable,
  membersTable,
} from "../db";
import { requireMediaAdmin } from "../middlewares/requireMediaAdmin";
import { listAdmins } from "../services/admin-state";
import { ensureSermonsSeeded } from "../services/sermons";
import { ensureArticlesSeeded } from "../services/articles";
import { toPublicVideo } from "../services/videos";

const router: IRouter = Router();

// ---- Sermons (create / update / delete) ----

router.get("/admin/sermons", requireMediaAdmin, async (_req, res) => {
  await ensureSermonsSeeded();
  const rows = await db.select().from(sermonsTable).orderBy(desc(sermonsTable.date));
  res.json(rows);
});

router.post("/admin/sermons", requireMediaAdmin, async (req, res) => {
  const parsed = insertSermonSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(sermonsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/admin/sermons/:id", requireMediaAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid sermon id" });
    return;
  }
  const parsed = insertSermonSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(sermonsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(sermonsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Sermon not found" });
    return;
  }
  res.json(row);
});

router.delete("/admin/sermons/:id", requireMediaAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid sermon id" });
    return;
  }
  const [row] = await db.delete(sermonsTable).where(eq(sermonsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Sermon not found" });
    return;
  }
  res.json({ deleted: true });
});

// ---- Articles (create / update / delete) ----
// Any signed-in Media Admin can write articles — there is no separate
// "author" role. The public /api/articles route only ever returns rows
// where published = true; admins see everything here, drafts included.

router.get("/admin/articles", requireMediaAdmin, async (_req, res) => {
  await ensureArticlesSeeded();
  const rows = await db.select().from(articlesTable).orderBy(desc(articlesTable.createdAt));
  res.json(rows);
});

router.post("/admin/articles", requireMediaAdmin, async (req, res) => {
  const parsed = insertArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(articlesTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.patch("/admin/articles/:id", requireMediaAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid article id" });
    return;
  }
  const parsed = insertArticleSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(articlesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(articlesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json(row);
});

router.delete("/admin/articles/:id", requireMediaAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid article id" });
    return;
  }
  const [row] = await db.delete(articlesTable).where(eq(articlesTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Article not found" });
    return;
  }
  res.json({ deleted: true });
});

// ---- Videos (create / update / delete) ----
// Admin pastes a YouTube link (or other embeddable/direct link) as
// `sourceUrl`; resolveVideoEmbed() (via toPublicVideo) derives the actual
// playable embed URL and thumbnail for the public site.

router.get("/admin/videos", requireMediaAdmin, async (_req, res) => {
  const rows = await db.select().from(videosTable).orderBy(desc(videosTable.createdAt));
  res.json(rows.map(toPublicVideo));
});

router.post("/admin/videos", requireMediaAdmin, async (req, res) => {
  const parsed = insertVideoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(videosTable).values(parsed.data).returning();
  res.status(201).json(toPublicVideo(row));
});

router.patch("/admin/videos/:id", requireMediaAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid video id" });
    return;
  }
  const parsed = insertVideoSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(videosTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(videosTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Video not found" });
    return;
  }
  res.json(toPublicVideo(row));
});

router.delete("/admin/videos/:id", requireMediaAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid video id" });
    return;
  }
  const [row] = await db.delete(videosTable).where(eq(videosTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Video not found" });
    return;
  }
  res.json({ deleted: true });
});

// ---- Read-only views for admins ----

router.get("/admin/prayers", requireMediaAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(prayerRequestsTable)
    .orderBy(desc(prayerRequestsTable.createdAt));
  res.json(rows);
});

router.get("/admin/members", requireMediaAdmin, async (_req, res) => {
  const rows = await db
    .select()
    .from(membersTable)
    .orderBy(desc(membersTable.createdAt));
  res.json(rows);
});

router.get("/admin/workers", requireMediaAdmin, async (_req, res) => {
  const admins = await listAdmins();
  res.json(admins);
});

export default router;
