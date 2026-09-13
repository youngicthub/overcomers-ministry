import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type AdminRecord = {
  id: string;
  name: string;
  createdAt: string;
};

type AdminStore = { admins: AdminRecord[] };
type OtpChallenge = {
  challengeId: string;
  adminId: string;
  adminName: string;
  otp: string;
  expiresAt: number;
};

const storePath = process.env.ADMIN_STORE_PATH
  ?? path.join(process.cwd(), "artifacts/api-server/data/admins.json");
const challenges = new Map<string, OtpChallenge>();
const sessions = new Map<string, { adminId: string; expiresAt: number }>();

async function readStore(): Promise<AdminStore> {
  try {
    const content = await fs.readFile(storePath, "utf8");
    return JSON.parse(content) as AdminStore;
  } catch {
    return { admins: [] };
  }
}

async function writeStore(store: AdminStore) {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function findAdmin(adminId: string) {
  const store = await readStore();
  return store.admins.find((admin) => admin.id === adminId) ?? null;
}

export async function requestAdminOtp(input: { name?: string; adminId?: string }) {
  const store = await readStore();
  let admin = input.adminId ? store.admins.find((item) => item.id === input.adminId) : undefined;

  if (input.adminId && !admin) return { error: "Admin ID not found" as const };
  if (!admin) {
    const name = input.name?.trim();
    if (!name) return { error: "Admin name is required for a new admin" as const };
    admin = {
      id: `adm_${crypto.randomBytes(6).toString("hex")}`,
      name,
      createdAt: new Date().toISOString(),
    };
    store.admins.push(admin);
    await writeStore(store);
  }

  const challenge: OtpChallenge = {
    challengeId: crypto.randomBytes(18).toString("hex"),
    adminId: admin.id,
    adminName: admin.name,
    otp: String(crypto.randomInt(100000, 1000000)),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  challenges.set(challenge.challengeId, challenge);
  return {
    challengeId: challenge.challengeId,
    adminId: challenge.adminId,
    adminName: challenge.adminName,
    otp: challenge.otp,
    expiresInSeconds: 600,
  };
}

export async function verifyAdminOtp(challengeId: string, otp: string) {
  const challenge = challenges.get(challengeId);
  if (!challenge || challenge.expiresAt < Date.now() || challenge.otp !== otp) {
    challenges.delete(challengeId);
    return null;
  }
  challenges.delete(challengeId);
  const sessionId = crypto.randomBytes(32).toString("hex");
  sessions.set(sessionId, { adminId: challenge.adminId, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  const admin = await findAdmin(challenge.adminId);
  return admin ? { sessionId, admin } : null;
}

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