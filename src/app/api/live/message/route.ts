import { z } from "zod/v4";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { requireAdmin } from "@/server/lib/admin-guard";
import { getLiveStatus, updateLiveMessage } from "@/server/services/live-state";

const UpdateLiveMessageBody = z.object({
  sessionId: z.string().min(1),
  message: z.string().trim().max(180),
});

export const POST = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = UpdateLiveMessageBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  if (!(await updateLiveMessage(parsed.data.sessionId, parsed.data.message))) {
    return json({ error: "Live session not found" }, 404);
  }
  return json(await getLiveStatus());
});
