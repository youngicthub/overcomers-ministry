import { testimonies } from "@/server/content";
import { json, PUBLIC_CACHE } from "@/server/lib/http";

export function GET() {
  return json(testimonies, 200, PUBLIC_CACHE);
}
