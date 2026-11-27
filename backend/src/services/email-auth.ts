import crypto from "node:crypto";
import { config } from "../config";
import { query, queryOne, withTransaction } from "../db";
import type { AuthTokenKind, AuthTokenRow, UserRow } from "../domain/types";
import {
  addMinutesIso,
  hmacSha256,
  nowIso,
  randomId,
  randomToken,
  sha256,
  timingSafeHex,
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

type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  age?: number;
  gender?: string;
  city?: string;
  state?: string;
  interestedIn?: string;
};

type LoginInput = { email: string; password: string };

function numericCode() {
  return String(crypto.randomInt(100000, 1_000_000));
}

function hashCode(email: string, code: string) {
  return hmacSha256(`${email}:${code}`, config.jwt.secret);
}

function ttlMinutes(kind: AuthTokenKind) {
  if (kind === "verify_email") return config.email.otpTtlMinutes;
  if (kind === "login") return config.email.loginOtpTtlMinutes;
  return config.email.resetTtlMinutes;
}

function resetLink(token: string) {
  return `${config.email.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function devFields(kind: AuthTokenKind, secret: string) {
  if (!exposeDevEmail()) return {};
  if (kind === "reset_password") {
    return { devToken: secret, devLink: resetLink(secret) };
  }
  return { devCode: secret };
}

async function issueToken(
  userId: string,
  email: string,
  kind: AuthTokenKind,
  secret: string
) {
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const recent = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM auth_tokens
     WHERE user_id = $1 AND type = $2 AND created_at > $3`,
    [userId, kind, hourAgo]
  );
  if (Number(recent?.count ?? 0) >= config.email.maxTokensPerHour) {
    throw tooMany("EMAIL_RATE_LIMITED", "Too many codes sent. Please try again later.");
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
      throw tooMany("EMAIL_RESEND_WAIT", `Please wait ${seconds} seconds before requesting another code.`);
    }
  }

  await query(
    `INSERT INTO auth_tokens
      (id, user_id, token_hash, type, email, expires_at, consumed_at, attempts, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NULL, 0, $7)`,
    [
      randomId(),
      userId,
      sha256(secret),
      kind,
      email,
      addMinutesIso(ttlMinutes(kind)),
      nowIso(),
    ]
  );
}

async function deliver(
  kind: AuthTokenKind,
  to: string,
  name: string,
  secret: string
) {
  const link = kind === "reset_password" ? resetLink(secret) : undefined;
  try {
    await getEmailProvider().send({
      kind,
      to,
      name,
      code: kind === "reset_password" ? undefined : secret,
      link,
    });
  } catch (error) {
    await query("DELETE FROM auth_tokens WHERE token_hash = $1", [sha256(secret)]).catch(() => {});
    logger.error("Auth email could not be delivered", {
      kind,
      to,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function sendOtp(user: UserRow, kind: "verify_email" | "login") {
  const code = numericCode();
  await issueToken(user.id, user.email, kind, hashCode(user.email, code));
  await deliver(kind, user.email, user.name, code);
  return { code, expiresAt: addMinutesIso(ttlMinutes(kind)) };
}

/** Verify a 6-digit OTP against the newest unconsumed token of this type. */
async function consumeOtp(email: string, code: string, kind: "verify_email" | "login") {
  const result = await withTransaction(async (tx) => {
    const tokenResult = await tx.query<AuthTokenRow>(
      `SELECT * FROM auth_tokens
       WHERE email = $1 AND type = $2 AND consumed_at IS NULL
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [email, kind]
    );
    const tokenRow = tokenResult.rows[0];
    if (!tokenRow) throw badRequest("OTP_NOT_FOUND", "Request a new code first.");
    if (new Date(tokenRow.expires_at).getTime() <= Date.now()) {
      throw gone("OTP_EXPIRED", "That code has expired. Request a new one.");
    }
    if (tokenRow.attempts >= config.email.maxOtpAttempts) {
      throw tooMany("OTP_ATTEMPTS_EXCEEDED", "Too many incorrect attempts. Request a new code.");
    }
    if (!timingSafeHex(tokenRow.token_hash, sha256(hashCode(email, code)))) {
      await tx.query("UPDATE auth_tokens SET attempts = attempts + 1 WHERE id = $1", [tokenRow.id]);
      throw badRequest("OTP_INVALID", "That code is incorrect.");
    }
    await tx.query("UPDATE auth_tokens SET consumed_at = $1 WHERE id = $2", [nowIso(), tokenRow.id]);
    const userResult = await tx.query<UserRow>("SELECT * FROM users WHERE id = $1", [
      tokenRow.user_id,
    ]);
    const user = userResult.rows[0];
    if (!user) throw notFound("USER_NOT_FOUND", "That account could not be found.");
    return user;
  });
  return result;
}

export async function register(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  if (await findUserByEmail(email)) {
    throw conflict("EMAIL_IN_USE", "An account with that email already exists.");
  }
  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email,
    passwordHash,
    name: input.name,
    emailVerified: false,
    age: input.age,
    gender: input.gender,
    city: input.city,
    state: input.state,
    interestedIn: input.interestedIn,
  });
  if (!user) throw new Error("Could not create user");

  const { code } = await sendOtp(user, "verify_email");
  return {
    user: await serializeOwnProfile(user),
    verificationRequired: true,
    ...devFields("verify_email", code),
  };
}

export async function verifyEmail(emailInput: string, code: string) {
  const email = normalizeEmail(emailInput);
  const user = await consumeOtp(email, code, "verify_email");
  if (!user.email_verified) {
    const updated = await queryOne<UserRow>(
      "UPDATE users SET email_verified = TRUE, updated_at = $1 WHERE id = $2 RETURNING *",
      [nowIso(), user.id]
    );
    if (!updated) throw notFound("USER_NOT_FOUND", "That account could not be found.");
    const tokens: SessionTokens = await issueSession(updated.id);
    return { user: await serializeOwnProfile(updated), tokens };
  }
  const tokens: SessionTokens = await issueSession(user.id);
  return { user: await serializeOwnProfile(user), tokens };
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
      "Verify your email before signing in. Check your inbox or request a new code."
    );
  }
  const { code, expiresAt } = await sendOtp(user, "login");
  return {
    otpRequired: true,
    email,
    expiresAt,
    ...devFields("login", code),
  };
}

export async function verifyLoginOtp(emailInput: string, code: string) {
  const email = normalizeEmail(emailInput);
  const user = await consumeOtp(email, code, "login");
  const tokens: SessionTokens = await issueSession(user.id);
  return { user: await serializeOwnProfile(user), tokens };
}

export async function resendOtp(emailInput: string, purpose: "verify_email" | "login") {
  const email = normalizeEmail(emailInput);
  const user = await findUserByEmail(email);
  if (!user) throw notFound("USER_NOT_FOUND", "That account could not be found.");
  if (purpose === "verify_email" && user.email_verified) return { ok: true };
  const { code } = await sendOtp(user, purpose);
  return { ok: true, ...devFields(purpose, code) };
}

export async function forgotPassword(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await findUserByEmail(email);
  // Always report success so accounts cannot be enumerated.
  if (!user) return { ok: true };
  try {
    const token = randomToken();
    await issueToken(user.id, user.email, "reset_password", token);
    await deliver("reset_password", user.email, user.name, token);
    return { ok: true, ...devFields("reset_password", token) };
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
