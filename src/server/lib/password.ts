import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

// scrypt parameters. N=16384 (2^14), r=8, p=1 is the configuration Node's
// own docs use as a baseline "reasonably secure" default; the resulting
// hash costs roughly 16-32MB of memory to compute, which is deliberately
// expensive enough to make large-scale offline password guessing slow
// without noticeably slowing down a single real sign-in.
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength = KEY_LENGTH,
  options = { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password.normalize("NFKC"), salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

/** Hashes a plaintext password into a single storable string:
 * "scrypt:N:r:p:saltHex:hashHex". Storing the parameters alongside the
 * hash means we can safely tune them later without invalidating existing
 * password hashes. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await deriveKey(password, salt);
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Verifies a plaintext password against a stored hash produced by
 * hashPassword(). Uses a constant-time comparison so response timing
 * can't be used to guess the correct hash byte-by-byte. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = parts;

  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await deriveKey(password, salt, expected.length, { N: n, r, p });

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

const MIN_PASSWORD_LENGTH = 10;

/** Minimum viable password policy: long enough, and not just letters (or
 * just digits) so a purely numeric or purely alphabetic guess doesn't
 * satisfy it. This is intentionally simple — length is the strongest
 * single factor against offline guessing — rather than a fragile
 * "must contain a symbol" rule that mostly just annoys people. */
export function isPasswordStrongEnough(password: string): boolean {
  if (password.length < MIN_PASSWORD_LENGTH) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  return hasLetter && hasDigit;
}

export { MIN_PASSWORD_LENGTH };
