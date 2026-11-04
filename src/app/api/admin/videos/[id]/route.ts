import { eq } from "drizzle-orm";
import { db, videosTable, insertVideoSchema } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { badRequest, json, parseId, readJson, routeWithParams } from "@/server/lib/http";
import { toPublicVideo } from "@/server/services/videos";

export const PATCH = routeWithParams<{ id: string }>(async (req, ctx) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const id = parseId((await ctx.params).id, "video");
  const parsed = insertVideoSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db
    .update(videosTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(videosTable.id, id))
    .returning();
  if (!row) return json({ error: "Video not found" }, 404);
  return json(toPublicVideo(row));
});

export const DELETE = routeWithParams<{ id: string }>(async (req, ctx) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const id = parseId((await ctx.params).id, "video");
  const [row] = await db.delete(videosTable).where(eq(videosTable.id, id)).returning();
  if (!row) return json({ error: "Video not found" }, 404);
  return json({ deleted: true });
});
