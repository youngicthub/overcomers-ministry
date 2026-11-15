import { z } from "zod/v4";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { requireAdmin } from "@/server/lib/admin-guard";
import { getViewerAnswer, publishViewerAnswer } from "@/server/services/live-state";

const ViewerAnswerBody = z.object({
  sessionId: z.string().min(1),
  viewerId: z.string().uuid(),
  type: z.string().min(1),
  sdp: z.string().min(1),
});
const ViewerAnswerQuery = z.object({
  sessionId: z.string().min(1),
  viewerId: z.string().uuid(),
});

export const GET = route(async (req) => {
  const parsed = ViewerAnswerQuery.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error.message);
  return json(await getViewerAnswer(parsed.data.sessionId, parsed.data.viewerId));
});

export const POST = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = ViewerAnswerBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  if (!(await publishViewerAnswer(parsed.data))) return badRequest("No matching viewer connection");
  return json({ message: "Viewer connection answer received." }, 201);
});
