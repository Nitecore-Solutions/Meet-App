import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config";
import { query, queryOne } from "../db";
import type { RefreshTokenRow } from "../domain/types";
import { addDaysIso, nowIso, randomId, sha256 } from "../utils/crypto";
import { unauthorized } from "../utils/errors";

type AccessTokenPayload = jwt.JwtPayload & {
  typ: "access";
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  refreshExpiresAt: string;
};

export function signAccessToken(userId: string) {
  return jwt.sign({ typ: "access" }, config.jwt.secret, {
    subject: userId,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    expiresIn: config.jwt.accessTokenTtl as SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string) {
  try {
    const payload = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as AccessTokenPayload;
    if (payload.typ !== "access" || !payload.sub) {
      throw new Error("Wrong token type");
    }
    return { userId: payload.sub };
  } catch {
    throw unauthorized("INVALID_TOKEN", "Your session is invalid or has expired.");
  }
}

async function createRefreshToken(userId: string) {
  const raw = crypto.randomBytes(48).toString("base64url");
  const id = randomId();
  const createdAt = nowIso();
  const expiresAt = addDaysIso(config.jwt.refreshTokenTtlDays);
  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at, created_at)
     VALUES ($1, $2, $3, $4, NULL, $5)`,
    [id, userId, sha256(raw), expiresAt, createdAt]
  );
  return { raw, expiresAt };
}

export async function issueSession(userId: string): Promise<SessionTokens> {
  const accessToken = signAccessToken(userId);
  const refresh = await createRefreshToken(userId);
  return {
    accessToken,
    refreshToken: refresh.raw,
    expiresIn: config.jwt.accessTokenTtl,
    refreshExpiresAt: refresh.expiresAt,
  };
}

export async function rotateRefreshToken(rawToken: string) {
  const tokenHash = sha256(rawToken);
  const row = await queryOne<RefreshTokenRow>(
    "SELECT * FROM refresh_tokens WHERE token_hash = $1",
    [tokenHash]
  );
  if (!row || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) {
    throw unauthorized("INVALID_REFRESH_TOKEN", "Your refresh token is invalid or has expired.");
  }

  await query("UPDATE refresh_tokens SET revoked_at = $1 WHERE id = $2", [nowIso(), row.id]);
  const accessToken = signAccessToken(row.user_id);
  const refresh = await createRefreshToken(row.user_id);
  return {
    userId: row.user_id,
    tokens: {
      accessToken,
      refreshToken: refresh.raw,
      expiresIn: config.jwt.accessTokenTtl,
      refreshExpiresAt: refresh.expiresAt,
    } satisfies SessionTokens,
  };
}

export async function revokeRefreshToken(rawToken: string) {
  await query(
    "UPDATE refresh_tokens SET revoked_at = $1 WHERE token_hash = $2 AND revoked_at IS NULL",
    [nowIso(), sha256(rawToken)]
  );
}
