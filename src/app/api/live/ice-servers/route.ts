import { json, route } from "@/server/lib/http";
import { getLiveIceServers } from "@/server/services/live-state";

export const GET = route(async () => json(getLiveIceServers()));
