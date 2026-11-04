import { NextResponse, type NextRequest } from "next/server";
import { describeDbError } from "./db-error";
import { ConfigError, HttpError } from "./config";

const MAX_JSON_BODY_BYTES = 512 * 1024;

export const NO_STORE = "no-store";
/** Public, read-mostly content: served from Vercel's edge cache for a minute
 * and revalidated in the background, so a traffic spike doesn't become a
 * database spike. Admin edits show up within ~1 minute. */
export const PUBLIC_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

export function json(data: unknown, status = 200, cacheControl: string = NO_STORE): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": cacheControl } });
}

export function badRequest(message: string): NextResponse {
  return json({ error: message }, 400);
}

/** Reads a JSON body with a size cap, throwing HttpError on bad input. */
export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (text.length > MAX_JSON_BODY_BYTES) throw new HttpError(413, "Request body is too large.");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export function parseId(raw: string, label: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id)) throw new HttpError(400, `Invalid ${label} id`);
  return id;
}

type RouteContext<P> = { params: Promise<P> };

/** Runs a handler so that anything thrown always becomes a JSON response
 * (never an HTML error page), with database problems surfaced as specific,
 * actionable messages — same behaviour as the old Express error handler. */
async function run(req: NextRequest, handler: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    if (err instanceof ConfigError) {
      console.error(err.message);
      return json({ error: err.message }, 503);
    }
    console.error(`${req.method} ${req.nextUrl.pathname} failed`, err);
    const described = describeDbError(err, "complete that request");
    if (described) return json({ error: described.message }, described.status);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}

/** Wraps a route handler for a route without dynamic segments. */
export function route(handler: (req: NextRequest) => Promise<Response> | Response) {
  return (req: NextRequest): Promise<Response> => run(req, () => handler(req));
}

/** Wraps a route handler for a dynamic route such as /api/admin/sermons/[id]. */
export function routeWithParams<P extends Record<string, string>>(
  handler: (req: NextRequest, ctx: RouteContext<P>) => Promise<Response> | Response,
) {
  return (req: NextRequest, ctx: RouteContext<P>): Promise<Response> => run(req, () => handler(req, ctx));
}
