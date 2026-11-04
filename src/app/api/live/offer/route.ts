import { z } from "zod/v4";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { requireAdmin } from "@/server/lib/admin-guard";
import { getOffer, publishOffer } from "@/server/services/live-state";

const PublishLiveOfferBody = z.object({
  sessionId: z.string().min(1),
  type: z.string().min(1),
  sdp: z.string().min(1),
  title: z.string().min(1),
});

export const GET = route(async () => json(await getOffer()));

export const POST = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = PublishLiveOfferBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  const { title, ...signal } = parsed.data;
  return json(await publishOffer(signal, title), 201);
});
