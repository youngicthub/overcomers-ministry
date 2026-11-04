import { z } from "zod/v4";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { requireAdmin } from "@/server/lib/admin-guard";
import { getLiveStatus, stopLive } from "@/server/services/live-state";

const StopLiveSessionBody = z.object({ sessionId: z.string().min(1) });

export const POST = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = StopLiveSessionBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  if (!(await stopLive(parsed.data.sessionId))) return json({ error: "Live session not found" }, 404);
  return json(await getLiveStatus());
});
