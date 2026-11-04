import crypto from "node:crypto";
import { eq, asc } from "drizzle-orm";
import { db, adminsTable } from "../db";
import { hashPassword, verifyPassword } from "../lib/password";
import { clear, extendWindow, hit, peek } from "../lib/rate-limit";

export type AdminRecord = {
  id: string;
  name: string;
  createdAt: string;
};

function toAdminRecord(row: { id: string; name: string; createdAt: Date }): AdminRecord {
  return { id: row.id, name: row.name, createdAt: row.createdAt.toISOString() };
}

// ---- Brute-force protection ----
// After too many wrong passwords for one admin ID, lock that ID out for a
// cooldown period. Keyed by adminId (not IP) so it also protects an account
// being hammered from many addresses at once. The counters live in Postgres
// (rate_limits) because serverless instances share no memory.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const failKey = (adminId: string) => `login-fail:${adminId}`;

export async function getLockoutRemainingMs(adminId: string): Promise<number> {
  const state = await peek(failKey(adminId));
  return state && state.count >= MAX_FAILED_ATTEMPTS ? state.retryAfterMs : 0;
}

async function registerFailedAttempt(adminId: string) {
  const { count } = await hit(failKey(adminId), LOCKOUT_MS);
  // The 5th failure starts a fresh full-length cooldown.
  if (count >= MAX_FAILED_ATTEMPTS) await extendWindow(failKey(adminId), LOCKOUT_MS);
}

// ---- Admin lookups ----

export async function findAdmin(adminId: string) {
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, adminId));
  return admin ? toAdminRecord(admin) : null;
}

export async function listAdmins() {
  const rows = await db.select().from(adminsTable).orderBy(asc(adminsTable.createdAt));
  return rows.map(toAdminRecord);
}

// ---- Sign-up (gated by MEDIA_ADMIN_ACCESS_TOKEN, checked by the route) ----

export async function createAdmin(input: { name: string; password: string }) {
  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(adminsTable)
    .values({ id: `adm_${crypto.randomBytes(6).toString("hex")}`, name: input.name, passwordHash })
    .returning();
  return toAdminRecord(created);
}

// ---- Sign-in ----

// A precomputed valid-looking hash used only to burn roughly the same
// amount of CPU time as a real verification when the admin ID doesn't
// exist at all (so response timing can't be used to enumerate admin IDs).
const DUMMY_HASH = "scrypt:16384:8:1:" + "00".repeat(16) + ":" + "00".repeat(64);

export async function verifyAdminPassword(adminId: string, password: string) {
  const [row] = await db.select().from(adminsTable).where(eq(adminsTable.id, adminId));
  if (!row) {
    await verifyPassword(password, DUMMY_HASH);
    return { error: "invalid" as const };
  }

  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) {
    await registerFailedAttempt(adminId);
    return { error: "invalid" as const };
  }

  await clear(failKey(adminId));
  return { admin: toAdminRecord(row) };
}

export function accessTokenMatches(input: string | undefined) {
  const configured = process.env.MEDIA_ADMIN_ACCESS_TOKEN;
  if (!configured || !input) return false;
  const expected = Buffer.from(configured);
  const received = Buffer.from(input);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
