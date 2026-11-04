import { eq } from "drizzle-orm";
import { appKvTable, db } from "../db";

export async function kvGet<T>(key: string): Promise<T | null> {
  const [row] = await db.select().from(appKvTable).where(eq(appKvTable.key, key));
  return row ? (row.value as T) : null;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await db
    .insert(appKvTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: appKvTable.key, set: { value, updatedAt: new Date() } });
}

export async function kvDelete(key: string): Promise<void> {
  await db.delete(appKvTable).where(eq(appKvTable.key, key));
}

/** Atomically claims a key. Exactly one caller (across ALL serverless
 * instances) gets `true` for a given key, ever — until it is deleted. */
export async function kvClaim(key: string): Promise<boolean> {
  const rows = await db
    .insert(appKvTable)
    .values({ key, value: { claimedAt: new Date().toISOString() } })
    .onConflictDoNothing()
    .returning({ key: appKvTable.key });
  return rows.length === 1;
}

// ---- One-time seeding ----
// The old Express server seeded starter content with in-memory flags and a
// marker file, which only worked for a single long-lived process. Here the
// "already seeded" flag lives in the database, so starter content is created
// once, ever — and an admin who deliberately deletes everything doesn't see
// it come back after the next cold start.

const seededInThisInstance = new Set<string>();
const inFlight = new Map<string, Promise<void>>();

export async function seedOnce(name: string, seed: () => Promise<void>): Promise<void> {
  if (seededInThisInstance.has(name)) return;
  let attempt = inFlight.get(name);
  if (!attempt) {
    const flagKey = `seed:${name}`;
    attempt = (async () => {
      if (await kvClaim(flagKey)) {
        try {
          await seed();
        } catch (err) {
          // Let the next request retry (e.g. the database was unreachable).
          await kvDelete(flagKey).catch(() => {});
          throw err;
        }
      }
      seededInThisInstance.add(name);
    })().finally(() => {
      inFlight.delete(name);
    });
    inFlight.set(name, attempt);
  }
  await attempt;
}
