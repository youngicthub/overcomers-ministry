import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fail fast with a clear timeout error instead of hanging for the OS's
  // default TCP timeout (which can be 30s+, and shows up as a confusing
  // ETIMEDOUT deep inside a query's stack trace). A serverless Postgres
  // provider (Neon, etc) waking a suspended database from cold can take a
  // couple of seconds — 10s comfortably covers that without leaving a
  // genuinely unreachable database hanging for a long time.
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  // Fires for errors on idle clients in the pool (e.g. the database
  // provider closing a connection server-side) — without this handler
  // those errors crash the process instead of just being logged.
  // eslint-disable-next-line no-console
  console.error("Unexpected error on idle Postgres client", err);
});

export const db = drizzle(pool, { schema });

export * from "./schema";
