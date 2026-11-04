import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db, galleryPhotosTable } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { json, parseId, routeWithParams } from "@/server/lib/http";

export const DELETE = routeWithParams<{ id: string }>(async (req, ctx) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const id = parseId((await ctx.params).id, "photo");
  const [row] = await db.delete(galleryPhotosTable).where(eq(galleryPhotosTable.id, id)).returning();
  if (!row) return json({ error: "Photo not found" }, 404);

  // Starter photos (url = null) are static files in /public; only uploaded
  // photos have a blob to remove. A failed blob delete must not fail the
  // request — the row is already gone.
  if (row.url) {
    try {
      await del(row.url);
    } catch (err) {
      console.error(`Failed to delete blob for gallery photo ${row.id}`, err);
    }
  }
  return json({ deleted: true });
});
