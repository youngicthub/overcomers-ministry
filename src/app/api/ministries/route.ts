import { ministries } from "@/server/content";
import { json, PUBLIC_CACHE } from "@/server/lib/http";

export function GET() {
  return json(ministries, 200, PUBLIC_CACHE);
}
