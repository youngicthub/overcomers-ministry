import crypto from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { json } from "./http";

// Fixed-window rate limiting backed by Postgres so the limits hold across
// every serverless instance (the old express-rate-limit used per-process
// memory, which on Vercel would reset on every cold start and be bypassed by
// simply landing on a different instance).

type Row = { count: number; ms_left: number };

/** Records one hit and returns the count within the current window. */
export async function hit(key: string, windowMs: number): Promise<{ count: number; retryAfterMs: number }> {
  const secs = Math.max(1, Math.ceil(windowMs / 1000));
  const result = await db.execute(sql`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${key}, 1, now() + make_interval(secs => ${secs}::double precision))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= now()
                      THEN now() + make_interval(secs => ${secs}::double precision)
                      ELSE rate_limits.reset_at END
    RETURNING count, (extract(epoch from (reset_at - now())) * 1000)::float8 AS ms_left
  `);
  const row = result.rows[0] as unknown as Row;

  // Housekeeping: occasionally drop expired windows so the table stays tiny.
  if (Math.random() < 0.02) {
    void db.execute(sql`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`).catch(() => {});
  }
  return { count: Number(row.count), retryAfterMs: Math.max(0, Number(row.ms_left)) };
}

/** Current count in an active window without recording a hit. */
export async function peek(key: string): Promise<{ count: number; retryAfterMs: number } | null> {
  const result = await db.execute(sql`
    SELECT count, (extract(epoch from (reset_at - now())) * 1000)::float8 AS ms_left
    FROM rate_limits WHERE key = ${key} AND reset_at > now()
  `);
  const row = result.rows[0] as unknown as Row | undefined;
  return row ? { count: Number(row.count), retryAfterMs: Math.max(0, Number(row.ms_left)) } : null;
}

/** Restarts a key's window from now (used to start the lockout cooldown). */
export async function extendWindow(key: string, windowMs: number): Promise<void> {
  const secs = Math.max(1, Math.ceil(windowMs / 1000));
  await db.execute(sql`
    UPDATE rate_limits SET reset_at = now() + make_interval(secs => ${secs}::double precision)
    WHERE key = ${key}
  `);
}

export async function clear(key: string): Promise<void> {
  await db.execute(sql`DELETE FROM rate_limits WHERE key = ${key}`);
}

/** Stable, non-reversible identifier for the caller's IP (we never store raw
 * addresses). On Vercel the platform sets x-real-ip / x-forwarded-for. */
export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = req.headers.get("x-real-ip") ?? forwarded ?? "unknown";
  const salt = process.env.SESSION_SECRET ?? "overcomers";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Per-IP limiter. Returns a 429 response when over the limit, else null. */
export async function limitByIp(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number,
  message: string,
) {
  const { count, retryAfterMs } = await hit(`${bucket}:${clientKey(req)}`, windowMs);
  if (count > limit) {
    const res = json({ error: message }, 429);
    res.headers.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
    return res;
  }
  return null;
}
