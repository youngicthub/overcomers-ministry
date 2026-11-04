import { db, membersTable, insertMemberSchema } from "@/server/db";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { limitByIp } from "@/server/lib/rate-limit";

export const POST = route(async (req) => {
  // Public forms have no login to limit by, so they're limited per IP:
  // generous for a real visitor, tight enough to blunt scripted spam.
  const limited = await limitByIp(req, "form", 20, 60 * 60 * 1000, "Too many submissions from this connection. Please try again later.");
  if (limited) return limited;

  const parsed = insertMemberSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  const [row] = await db.insert(membersTable).values({ ...parsed.data, birthday: parsed.data.birthday || null }).returning();
  return json({ id: String(row.id), message: "Welcome to the family. Our team will be in touch soon." }, 201);
});
