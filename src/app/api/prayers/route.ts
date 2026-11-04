import { db, prayerRequestsTable, insertPrayerRequestSchema } from "@/server/db";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { limitByIp } from "@/server/lib/rate-limit";

export const POST = route(async (req) => {
  // Public forms have no login to limit by, so they're limited per IP:
  // generous for a real visitor, tight enough to blunt scripted spam.
  const limited = await limitByIp(req, "form", 20, 60 * 60 * 1000, "Too many submissions from this connection. Please try again later.");
  if (limited) return limited;

  const parsed = insertPrayerRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db.insert(prayerRequestsTable).values({
    name: parsed.data.name || null,
    request: parsed.data.request,
    anonymous: parsed.data.anonymous,
  }).returning();
  return json({ id: String(row.id), message: "Your prayer request has been received. We will stand with you in prayer." }, 201);
});
