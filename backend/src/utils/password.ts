import crypto from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;

function scrypt(password: string, salt: Buffer, keyLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}

/** Hash a password with Node's built-in scrypt. Format: scrypt$<salt>$<hash>. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

/** Constant-time verification of a password against a stored scrypt hash. */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  const [scheme, saltValue, hashValue] = parts;
  if (scheme !== "scrypt" || !saltValue || !hashValue) return false;
  try {
    const expected = Buffer.from(hashValue, "base64url");
    if (expected.length === 0) return false;
    const actual = await scrypt(password, Buffer.from(saltValue, "base64url"), expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
