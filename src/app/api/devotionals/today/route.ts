import { json, PUBLIC_CACHE } from "@/server/lib/http";
import { getTodaysDevotional } from "@/server/services/devotionals";

export function GET() {
  // Short cache: the devotional changes at midnight.
  return json(getTodaysDevotional(), 200, "public, s-maxage=300, stale-while-revalidate=600");
}
