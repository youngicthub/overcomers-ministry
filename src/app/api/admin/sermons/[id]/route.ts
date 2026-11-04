import { eq } from "drizzle-orm";
import { db, sermonsTable, insertSermonSchema } from "@/server/db";
import { requireAdmin } from "@/server/lib/admin-guard";
import { badRequest, json, parseId, readJson, routeWithParams } from "@/server/lib/http";

export const PATCH = routeWithParams<{ id: string }>(async (req, ctx) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const id = parseId((await ctx.params).id, "sermon");
  const parsed = insertSermonSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db
    .update(sermonsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(sermonsTable.id, id))
    .returning();
  if (!row) return json({ error: "Sermon not found" }, 404);
  return json(row);
});

export const DELETE = routeWithParams<{ id: string }>(async (req, ctx) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const id = parseId((await ctx.params).id, "sermon");
  const [row] = await db.delete(sermonsTable).where(eq(sermonsTable.id, id)).returning();
  if (!row) return json({ error: "Sermon not found" }, 404);
  return json({ deleted: true });
});
