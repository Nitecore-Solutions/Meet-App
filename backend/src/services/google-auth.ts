import { config } from "../config";
import { queryOne } from "../db";
import type { UserRow } from "../domain/types";
import { nowIso, randomToken } from "../utils/crypto";
import { normalizeEmail } from "../utils/email";
import { AppError, forbidden, unauthorized } from "../utils/errors";
import { hashPassword } from "../utils/password";
import { issueSession } from "./tokens";
import { createUser, findUserByEmail, serializeOwnProfile } from "./users";

type TokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  sub?: string;
};

/**
 * Sign in or sign up with a Google ID token. Google account email is treated as
 * verified, so this path never sends an email OTP.
 */
export async function googleSignIn(idToken: string) {
  if (!config.google.clientId) {
    throw new AppError(503, "GOOGLE_NOT_CONFIGURED", "Google sign-in is not configured on the server.");
  }

  let info: TokenInfo;
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { signal: AbortSignal.timeout(10_000) }
    );
    if (!response.ok) throw new Error("Token rejected");
    info = (await response.json()) as TokenInfo;
  } catch {
    throw unauthorized("INVALID_GOOGLE_TOKEN", "That Google sign-in token is invalid or expired.");
  }

  if (info.aud !== config.google.clientId) {
    throw unauthorized("INVALID_GOOGLE_TOKEN", "This token was issued for another app.");
  }
  if (!info.email || (info.email_verified !== true && info.email_verified !== "true")) {
    throw forbidden("GOOGLE_EMAIL_NOT_VERIFIED", "Please use a Google account with a verified email.");
  }

  const email = normalizeEmail(info.email);
  let user: UserRow | null = await findUserByEmail(email);
  let isNewUser = false;
  if (!user) {
    user = await createUser({
      email,
      passwordHash: await hashPassword(randomToken()),
      name: info.name,
      emailVerified: true,
    });
    isNewUser = true;
  } else if (!user.email_verified) {
    user = await queryOne<UserRow>(
      "UPDATE users SET email_verified = TRUE, updated_at = $1 WHERE id = $2 RETURNING *",
      [nowIso(), user.id]
    );
  }
  if (!user) throw new Error("Could not load the Google account");

  const tokens = await issueSession(user.id);
  return { user: await serializeOwnProfile(user), tokens, isNewUser };
}
