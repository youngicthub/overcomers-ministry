import { z } from "zod/v4";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { requireAdmin } from "@/server/lib/admin-guard";
import { getAnswer, publishAnswer } from "@/server/services/live-state";

const LiveSignalBody = z.object({
  sessionId: z.string().min(1),
  type: z.string().min(1),
  sdp: z.string().min(1),
});
const GetLiveAnswerQueryParams = z.object({ sessionId: z.string().min(1) });

export const GET = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = GetLiveAnswerQueryParams.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error.message);
  return json(await getAnswer(parsed.data.sessionId));
});

// Public on purpose: a viewer's browser posts its answer to join.
export const POST = route(async (req) => {
  const parsed = LiveSignalBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  const accepted = await publishAnswer(parsed.data);
  if (!accepted) return badRequest("No matching live session");
  return json({ id: `answer-${Date.now()}`, message: "Live connection answer received." }, 201);
});
