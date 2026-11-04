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

export type DescribedDbError = { status: number; message: string };

/** Pure detection, with no Express dependency, so it can be used both by
 * routes that explicitly catch a DB call (handleDbError below) AND by
 * the global error handler (middlewares/error-handler.ts) that catches
 * whatever every OTHER route didn't handle itself — one place to keep
 * this logic, applied everywhere automatically. Returns null when the
 * error doesn't match a recognized DB-connectivity/schema/auth pattern
 * (i.e. it's something else — a real bug, a bad request, etc). */
export function describeDbError(err: unknown, action: string): DescribedDbError | null {
  const code = findCode(err as PgError);
  if (!code) return null;

  if (SCHEMA_MISMATCH_CODES.has(code)) {
    return {
      status: 500,
      message:
        `Could not ${action}: the database schema is out of date ` +
        `(missing column or table). Run "npm run db:push" against this ` +
        `database (see README), then try again.`,
    };
  }

  if (CONNECTION_ERROR_CODES.has(code)) {
    return {
      status: 503,
      message:
        `Could not ${action}: the database is unreachable right now ` +
        `(${code}). Check that your database is awake and that ` +
        `DATABASE_URL in your Vercel environment variables is correct, then try again.`,
    };
  }

  if (AUTH_ERROR_CODES.has(code)) {
    return {
      status: 500,
      message:
        `Could not ${action}: the database rejected the credentials in ` +
        `DATABASE_URL. Copy a fresh connection string from your database ` +
        `provider and update it in your Vercel environment variables.`,
    };
  }

  return null;
}
