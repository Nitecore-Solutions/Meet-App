import { config } from "../config";
import { query, queryOne, withTransaction } from "../db";
import type { AuthTokenKind, AuthTokenRow, UserRow } from "../domain/types";
import {
  addMinutesIso,
  nowIso,
  randomId,
  randomToken,
  sha256,
} from "../utils/crypto";
import { normalizeEmail } from "../utils/email";
import {
  badRequest,
  conflict,
  forbidden,
  gone,
  notFound,
  tooMany,
  unauthorized,
} from "../utils/errors";
import { logger } from "../utils/logger";
import { hashPassword, verifyPassword } from "../utils/password";
import { exposeDevEmail, getEmailProvider } from "./email-providers";
import { issueSession, type SessionTokens } from "./tokens";
import {
  createUser,
  findUserByEmail,
  findUserById,
  serializeOwnProfile,
} from "./users";

type RegisterInput = { email: string; password: string; name?: string };
type LoginInput = { email: string; password: string };

function linkFor(kind: AuthTokenKind, token: string) {
  const page = kind === "verify_email" ? "verify-email" : "reset-password";
  return `${config.email.appUrl}/${page}?token=${encodeURIComponent(token)}`;
}

function ttlMinutes(kind: AuthTokenKind) {
  return kind === "verify_email"
    ? config.email.verifyTtlMinutes
    : config.email.resetTtlMinutes;
}

function devFields(token: string, kind: AuthTokenKind) {
  if (!exposeDevEmail()) return {};
  return { devToken: token, devLink: linkFor(kind, token) };
}

/** Issue a hashed, single-use, time-limited token and enforce resend/count limits. */
async function issueAuthToken(
  userId: string,
  email: string,
  kind: AuthTokenKind
): Promise<string> {
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const recent = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM auth_tokens
     WHERE user_id = $1 AND type = $2 AND created_at > $3`,
    [userId, kind, hourAgo]
  );
  if (Number(recent?.count ?? 0) >= config.email.maxTokensPerHour) {
    throw tooMany("EMAIL_RATE_LIMITED", "Too many emails sent. Please try again later.");
  }

  const latest = await queryOne<{ created_at: string }>(
    `SELECT created_at FROM auth_tokens
     WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1`,
    [userId, kind]
  );
  if (latest) {
    const elapsed = Date.now() - new Date(latest.created_at).getTime();
    if (elapsed < config.email.resendSeconds * 1000) {
      const seconds = Math.ceil((config.email.resendSeconds * 1000 - elapsed) / 1000);
      throw tooMany("EMAIL_RESEND_WAIT", `Please wait ${seconds} seconds before requesting another email.`);
    }
  }

  const raw = randomToken();
  await query(
    `INSERT INTO auth_tokens
      (id, user_id, token_hash, type, email, expires_at, consumed_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)`,
    [
      randomId(),
      userId,
      sha256(raw),
      kind,
      email,
      addMinutesIso(ttlMinutes(kind)),
      nowIso(),
    ]
  );
  return raw;
}

async function deliver(kind: AuthTokenKind, to: string, name: string, token: string) {
  const link = linkFor(kind, token);
  try {
    await getEmailProvider().send({ kind, to, name, link, token });
  } catch (error) {
    await query("DELETE FROM auth_tokens WHERE token_hash = $1", [sha256(token)]).catch(() => {});
    logger.error("Auth email could not be delivered", {
      kind,
      to,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
  return link;
}

export async function register(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(email);
  if (existing) {
    throw conflict("EMAIL_IN_USE", "An account with that email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({ email, passwordHash, name: input.name, emailVerified: false });
  if (!user) throw new Error("Could not create user");

  const token = await issueAuthToken(user.id, email, "verify_email");
  const link = await deliver("verify_email", email, user.name, token);

  return {
    user: await serializeOwnProfile(user),
    verificationRequired: true,
    ...devFields(token, "verify_email"),
    // `link` is included in dev responses for easy manual testing.
    ...(exposeDevEmail() ? { devLink: link } : {}),
  };
}

export async function verifyEmail(rawToken: string) {
  const tokenHash = sha256(rawToken);
  const result = await withTransaction(async (tx) => {
    const tokenResult = await tx.query<AuthTokenRow>(
      "SELECT * FROM auth_tokens WHERE token_hash = $1 FOR UPDATE",
      [tokenHash]
    );
    const tokenRow = tokenResult.rows[0];
    if (!tokenRow) throw badRequest("INVALID_TOKEN", "That verification link is invalid.");
    if (tokenRow.type !== "verify_email") {
      throw badRequest("INVALID_TOKEN", "That link is not for email verification.");
    }
    if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      throw gone("TOKEN_EXPIRED", "That link has expired. Request a new one.");
    }

    if (tokenRow.consumed_at) {
      const existing = await tx.query<UserRow>("SELECT * FROM users WHERE id = $1", [
        tokenRow.user_id,
      ]);
      if (existing.rows[0]?.email_verified) {
        return { user: existing.rows[0], alreadyVerified: true };
      }
      throw conflict("TOKEN_ALREADY_USED", "This link has already been used.");
    }

    await tx.query("UPDATE auth_tokens SET consumed_at = $1 WHERE id = $2", [
      nowIso(),
      tokenRow.id,
    ]);
    const updated = await tx.query<UserRow>(
      `UPDATE users SET email_verified = TRUE, updated_at = $1
       WHERE id = $2 RETURNING *`,
      [nowIso(), tokenRow.user_id]
    );
    const user = updated.rows[0];
    if (!user) throw notFound("USER_NOT_FOUND", "That account could not be found.");
    return { user, alreadyVerified: false };
  });

  const tokens: SessionTokens = await issueSession(result.user.id);
  return {
    user: await serializeOwnProfile(result.user),
    tokens,
    alreadyVerified: result.alreadyVerified,
  };
}

export async function resendVerification(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await findUserByEmail(email);
  if (!user || user.email_verified) return { ok: true };

  const token = await issueAuthToken(user.id, user.email, "verify_email");
  const link = await deliver("verify_email", user.email, user.name, token);
  return { ok: true, ...devFields(token, "verify_email"), ...(exposeDevEmail() ? { devLink: link } : {}) };
}

export async function login(input: LoginInput) {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    throw unauthorized("INVALID_CREDENTIALS", "Incorrect email or password.");
  }
  if (!user.email_verified) {
    throw forbidden(
      "EMAIL_NOT_VERIFIED",
      "Please verify your email before signing in. Check your inbox or request a new verification link."
    );
  }
  const tokens = await issueSession(user.id);
  return { user: await serializeOwnProfile(user), tokens };
}

export async function forgotPassword(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await findUserByEmail(email);
  // Always report success so account existence is not revealed.
  if (!user) return { ok: true };
  try {
    const token = await issueAuthToken(user.id, user.email, "reset_password");
    const link = await deliver("reset_password", user.email, user.name, token);
    return { ok: true, ...devFields(token, "reset_password"), ...(exposeDevEmail() ? { devLink: link } : {}) };
  } catch (error) {
    logger.warn("Password reset request could not be completed", {
      userId: user.id,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: true };
  }
}

export async function resetPassword(rawToken: string, password: string) {
  const passwordHash = await hashPassword(password);
  const tokenHash = sha256(rawToken);

  await withTransaction(async (tx) => {
    const tokenResult = await tx.query<AuthTokenRow>(
      "SELECT * FROM auth_tokens WHERE token_hash = $1 FOR UPDATE",
      [tokenHash]
    );
    const row = tokenResult.rows[0];
    if (!row) throw badRequest("INVALID_TOKEN", "That password reset link is invalid.");
    if (row.type !== "reset_password") {
      throw badRequest("INVALID_TOKEN", "That link is not for password reset.");
    }
    if (row.consumed_at) throw conflict("TOKEN_ALREADY_USED", "This link has already been used.");
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      throw gone("TOKEN_EXPIRED", "That link has expired. Request a new one.");
    }

    const timestamp = nowIso();
    await tx.query("UPDATE auth_tokens SET consumed_at = $1 WHERE id = $2", [timestamp, row.id]);
    await tx.query("UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3", [
      passwordHash,
      timestamp,
      row.user_id,
    ]);
    await tx.query(
      "UPDATE refresh_tokens SET revoked_at = $1 WHERE user_id = $2 AND revoked_at IS NULL",
      [timestamp, row.user_id]
    );
  });

  logger.info("Password reset completed");
  return { ok: true };
}
