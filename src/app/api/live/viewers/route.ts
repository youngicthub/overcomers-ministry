import { z } from "zod/v4";
import { badRequest, json, readJson, route } from "@/server/lib/http";
import { requireAdmin } from "@/server/lib/admin-guard";
import { getPendingViewerOffers, publishViewerOffer } from "@/server/services/live-state";

const ViewerOfferBody = z.object({
  sessionId: z.string().min(1),
  viewerId: z.string().uuid(),
  type: z.string().min(1),
  sdp: z.string().min(1),
});
const ViewerOffersQuery = z.object({ sessionId: z.string().min(1) });

export const GET = route(async (req) => {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  const parsed = ViewerOffersQuery.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return badRequest(parsed.error.message);
  return json(await getPendingViewerOffers(parsed.data.sessionId));
});

export const POST = route(async (req) => {
  const parsed = ViewerOfferBody.safeParse(await readJson(req));
  if (!parsed.success) return badRequest(parsed.error.message);

  if (!(await publishViewerOffer(parsed.data))) return badRequest("No matching live session");
  return json({ message: "Viewer connection offer received." }, 201);
});
