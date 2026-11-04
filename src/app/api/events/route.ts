import { events } from "@/server/content";
import { json, PUBLIC_CACHE } from "@/server/lib/http";

export function GET() {
  return json(events, 200, PUBLIC_CACHE);
}
