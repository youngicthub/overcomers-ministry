import { json, route } from "@/server/lib/http";
import { getLiveStatus } from "@/server/services/live-state";

export const GET = route(async () => json(await getLiveStatus()));
