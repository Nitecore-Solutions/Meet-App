import type { Request, RequestHandler } from "express";
import type { UserRow } from "../domain/types";
import { query } from "../db";
import { nowIso } from "../utils/crypto";
import { unauthorized } from "../utils/errors";
import { findUserById } from "../services/users";
import { verifyAccessToken } from "../services/tokens";

declare global {
  namespace Express {
    interface Request {
      authUser?: UserRow;
    }
  }
}

function bearerToken(req: Request) {
  const header = req.header("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(/\s+/, 2);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = bearerToken(req);
    if (!token) throw unauthorized();
    const { userId } = verifyAccessToken(token);
    const user = await findUserById(userId);
    if (!user) throw unauthorized("USER_NOT_FOUND", "Your account could not be found.");
    req.authUser = user;
    void query("UPDATE users SET last_active_at = $1 WHERE id = $2", [
      nowIso(),
      user.id,
    ]).catch(() => {});
    next();
  } catch (error) {
    next(error);
  }
};

export function authUser(req: Request): UserRow {
  if (!req.authUser) throw unauthorized();
  return req.authUser;
}
