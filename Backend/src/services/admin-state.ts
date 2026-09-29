import crypto from "node:crypto";
import { eq, asc } from "drizzle-orm";
import { db, adminsTable } from "../db";
import { hashPassword, verifyPassword } from "../lib/password";

export type AdminRecord = {
  id: string;
  name: string;
  createdAt: string;
};

function toAdminRecord(row: { id: string; name: string; createdAt: Date }): AdminRecord {
  return { id: row.id, name: row.name, createdAt: row.createdAt.toISOString() };
}

// In-memory: sessions and login-attempt counters do not need to survive a
// server restart, and keeping them out of Postgres avoids a second,
// higher-write table. Only the admins themselves (identity + name +
// password hash) are persisted, in the `admins` table, so accounts
// survive restarts.
const sessions = new Map<string, { adminId: string; expiresAt: number }>();

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// ---- Brute-force protection ----
// After too many wrong passwords for one admin ID, lock that ID out for a
// cooldown period. This is keyed by adminId (not IP) so it also protects
// an account being hammered from many different addresses at once.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

type AttemptState = { failures: number; lockedUntil: number | null };
const loginAttempts = new Map<string, AttemptState>();

export function getLockoutRemainingMs(adminId: string): number {
  const state = loginAttempts.get(adminId);
  if (!state?.lockedUntil) return 0;
  return Math.max(0, state.lockedUntil - Date.now());
}

function registerFailedAttempt(adminId: string) {
  const state = loginAttempts.get(adminId) ?? { failures: 0, lockedUntil: null };
  state.failures += 1;
  if (state.failures >= MAX_FAILED_ATTEMPTS) {
    state.lockedUntil = Date.now() + LOCKOUT_MS;
    state.failures = 0;
  }
  loginAttempts.set(adminId, state);
}

function clearFailedAttempts(adminId: string) {
  loginAttempts.delete(adminId);
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

export async function verifyAdminPassword(adminId: string, password: string) {
  if (getLockoutRemainingMs(adminId) > 0) {
    return { error: "locked" as const };
  }

  const [row] = await db.select().from(adminsTable).where(eq(adminsTable.id, adminId));
  if (!row) {
    // Still run a hash comparison against a dummy value so responding to
    // "admin ID doesn't exist" doesn't take a measurably different amount
    // of time than "wrong password" — that timing difference is itself a
    // way to enumerate valid admin IDs.
    await verifyPassword(password, DUMMY_HASH);
    return { error: "invalid" as const };
  }

  const ok = await verifyPassword(password, row.passwordHash);
  if (!ok) {
    registerFailedAttempt(adminId);
    return { error: "invalid" as const };
  }

  clearFailedAttempts(adminId);
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { adminId, expiresAt: Date.now() + SESSION_TTL_MS });
  return { sessionId, admin: toAdminRecord(row) };
}

// A precomputed valid-looking hash used only to burn roughly the same
// amount of CPU time as a real verification when the admin ID doesn't
// exist at all.
const DUMMY_HASH =
  "scrypt:16384:8:1:" + "00".repeat(16) + ":" + "00".repeat(64);

// ---- Sessions ----

export async function getAdminForSession(sessionId?: string) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return findAdmin(session.adminId);
}

export function deleteAdminSession(sessionId?: string) {
  if (sessionId) sessions.delete(sessionId);
}

export function accessTokenMatches(input: string | undefined) {
  const configured = process.env.MEDIA_ADMIN_ACCESS_TOKEN;
  if (!configured || !input) return false;
  const expected = Buffer.from(configured);
  const received = Buffer.from(input);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
