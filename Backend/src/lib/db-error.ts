import type { Response } from "express";
import type { Request } from "express";

type PgError = { code?: string; message?: string; cause?: PgError };

/** Postgres error codes for "column does not exist" / "relation (table)
 * does not exist" — almost always caused by the schema file changing
 * without `npm run db:push` having been re-run against the actual
 * database. Detecting this specifically turns a confusing generic 500
 * into "run this one command" — worth the extra check. */
const SCHEMA_MISMATCH_CODES = new Set(["42703", "42P01"]);

/** Node/OS-level network error codes that mean "never actually reached
 * the database", as opposed to the database responding with a real SQL
 * error. drizzle-orm wraps these in a DrizzleQueryError whose `.cause` is
 * the original error (visible as "caused by: ..." when logged), so we
 * check both the error itself and one level of `.cause`. */
const CONNECTION_ERROR_CODES = new Set([
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "ENOTFOUND",
  "EAI_AGAIN",
]);

/** Postgres error code for "password authentication failed" / role does
 * not exist — nearly always a wrong/stale DATABASE_URL credential. */
const AUTH_ERROR_CODES = new Set(["28P01", "28000", "3D000"]);

function findCode(err: PgError | undefined, depth = 0): string | undefined {
  if (!err || depth > 3) return undefined;
  if (err.code) return err.code;
  return findCode(err.cause, depth + 1);
}

export function handleDbError(req: Request, res: Response, err: unknown, action: string) {
  req.log?.error({ err }, `Database error while trying to ${action}`);
  const code = findCode(err as PgError);

  if (code && SCHEMA_MISMATCH_CODES.has(code)) {
    res.status(500).json({
      error:
        `Could not ${action}: the database schema is out of date ` +
        `(missing column or table). Run "npm run db:push" (or ` +
        `"npm run db:push:force" if it asks about existing data) in ` +
        `Backend, then try again.`,
    });
    return;
  }

  if (code && CONNECTION_ERROR_CODES.has(code)) {
    res.status(503).json({
      error:
        `Could not ${action}: the database is unreachable right now ` +
        `(${code}). Check that your database is awake and that ` +
        `DATABASE_URL in Backend/.env is correct, then try again.`,
    });
    return;
  }

  if (code && AUTH_ERROR_CODES.has(code)) {
    res.status(500).json({
      error:
        `Could not ${action}: the database rejected the credentials in ` +
        `DATABASE_URL. Copy a fresh connection string from your database ` +
        `provider and update Backend/.env.`,
    });
    return;
  }

  res.status(500).json({ error: `Could not ${action}. Please try again.` });
}
