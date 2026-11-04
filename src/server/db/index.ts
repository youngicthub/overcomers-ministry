import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type Db = NodePgDatabase<typeof schema>;
const globalForDb = globalThis as unknown as { __overcomersDb?: Db };

/** Neon's dashboard string includes "&channel_binding=require", which node-postgres
 * handles inconsistently (it can hang during auth instead of failing). It's
 * safe to drop — TLS (sslmode=require) is still enforced. */
function connectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL must be set (Vercel → Project → Settings → Environment Variables).");
  }
  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return raw;
  }
}

function createDb(): Db {
  const pool = new Pool({
    connectionString: connectionString(),
    // Serverless: keep the per-instance pool small and let idle sockets go
    // quickly so we don't hold database connections open for no reason.
    // (Use your provider's *pooled* connection string — for Neon, the host
    // containing "-pooler".)
    max: 5,
    idleTimeoutMillis: 10_000,
    // A suspended serverless Postgres (Neon) can take a few seconds to wake.
    connectionTimeoutMillis: 20_000,
  });
  pool.on("error", (err) => {
    // Idle-client errors (e.g. the provider closing a connection) must not
    // crash the instance.
    console.error("Unexpected error on idle Postgres client", err);
  });
  return drizzle(pool, { schema });
}

/** Lazily created so that importing this module (e.g. during `next build`)
 * never requires DATABASE_URL — only an actual query does. Cached on
 * globalThis so dev hot-reloads and warm lambdas reuse one pool. */
function getDb(): Db {
  globalForDb.__overcomersDb ??= createDb();
  return globalForDb.__overcomersDb;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = (real as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export * from "./schema";
