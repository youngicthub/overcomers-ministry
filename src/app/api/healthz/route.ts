import { json } from "@/server/lib/http";

export function GET() {
  return json({ status: "ok" });
}
