import { query, queryOne } from "../db";
import type { MatchRow, UserRow } from "../domain/types";
import { nowIso } from "../utils/crypto";
import { badRequest, notFound } from "../utils/errors";
import { realtimeBus } from "../realtime/events";
import {
  createMatchForPair,
  getMatchBetween,
  getMatchForUser,
  matchParticipantIds,
} from "./chat";
import {
  findUserById,
  requireUserById,
  serializePublicProfile,
} from "./users";

async function requireTarget(userId: string, targetId: string) {
  if (userId === targetId) {
    throw badRequest("INVALID_TARGET", "You cannot do that to your own profile.");
  }
  const target = await findUserById(targetId);
  if (!target) throw notFound("USER_NOT_FOUND", "That profile could not be found.");
  return target;
}

async function blockedBetween(userId: string, targetId: string) {
  const row = await queryOne<{ blocker_id: string }>(
    `SELECT blocker_id FROM blocks
     WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)`,
    [userId, targetId]
  );
  return Boolean(row);
}

export async function likeUser(userId: string, targetId: string) {
  await requireTarget(userId, targetId);
  if (await blockedBetween(userId, targetId)) {
    throw notFound("USER_NOT_FOUND", "That profile could not be found.");
  }

  await query(
    `INSERT INTO likes (from_user_id, to_user_id, created_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (from_user_id, to_user_id) DO NOTHING`,
    [userId, targetId, nowIso()]
  );
  await query("DELETE FROM passes WHERE from_user_id = $1 AND to_user_id = $2", [
    userId,
    targetId,
  ]);

  const existingMatch = await getMatchBetween(userId, targetId);
  if (existingMatch) {
    return { liked: true, matched: true, matchId: existingMatch.id };
  }

  const reciprocal = await queryOne<{ from_user_id: string }>(
    "SELECT from_user_id FROM likes WHERE from_user_id = $1 AND to_user_id = $2",
    [targetId, userId]
  );
  if (!reciprocal) return { liked: true, matched: false, matchId: null };

  const match = await createMatchForPair(userId, targetId);
  return { liked: true, matched: true, matchId: match.id };
}

export async function passUser(userId: string, targetId: string) {
  await requireTarget(userId, targetId);
  await query(
    `INSERT INTO passes (from_user_id, to_user_id, created_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (from_user_id, to_user_id) DO NOTHING`,
    [userId, targetId, nowIso()]
  );
  await query("DELETE FROM likes WHERE from_user_id = $1 AND to_user_id = $2", [
    userId,
    targetId,
  ]);
  return { passed: true };
}

export async function blockUser(userId: string, targetId: string) {
  await requireTarget(userId, targetId);
  await query(
    `INSERT INTO blocks (blocker_id, blocked_id, created_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
    [userId, targetId, nowIso()]
  );
  await query(
    `DELETE FROM likes
     WHERE (from_user_id = $1 AND to_user_id = $2)
        OR (from_user_id = $2 AND to_user_id = $1)`,
    [userId, targetId]
  );
  await query(
    `DELETE FROM passes
     WHERE (from_user_id = $1 AND to_user_id = $2)
        OR (from_user_id = $2 AND to_user_id = $1)`,
    [userId, targetId]
  );
  const match = await getMatchBetween(userId, targetId);
  if (match) {
    const participants = matchParticipantIds(match);
    await query("DELETE FROM matches WHERE id = $1", [match.id]);
    realtimeBus.emitEvent({
      type: "match:removed",
      matchId: match.id,
      participantIds: participants,
    });
  }
  return { blocked: true };
}

export async function unblockUser(userId: string, targetId: string) {
  await query("DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2", [
    userId,
    targetId,
  ]);
  return { blocked: false };
}

export async function getSocialState(userId: string, targetId: string) {
  const [liked, passed, blocked, match] = await Promise.all([
    queryOne<{ from_user_id: string }>(
      "SELECT from_user_id FROM likes WHERE from_user_id = $1 AND to_user_id = $2",
      [userId, targetId]
    ),
    queryOne<{ from_user_id: string }>(
      "SELECT from_user_id FROM passes WHERE from_user_id = $1 AND to_user_id = $2",
      [userId, targetId]
    ),
    queryOne<{ blocker_id: string }>(
      "SELECT blocker_id FROM blocks WHERE blocker_id = $1 AND blocked_id = $2",
      [userId, targetId]
    ),
    getMatchBetween(userId, targetId),
  ]);
  const likedMe = await queryOne<{ from_user_id: string }>(
    "SELECT from_user_id FROM likes WHERE from_user_id = $1 AND to_user_id = $2",
    [targetId, userId]
  );
  return {
    liked: Boolean(liked),
    likedMe: Boolean(likedMe),
    passed: Boolean(passed),
    blocked: Boolean(blocked),
    matched: Boolean(match),
    matchId: match?.id ?? null,
  };
}

export async function listIncomingLikes(userId: string) {
  const viewer = await requireUserById(userId);
  const rows = await query<UserRow & { liked_at: string }>(
    `SELECT u.*, l.created_at AS liked_at
     FROM likes l
     JOIN users u ON u.id = l.from_user_id
     WHERE l.to_user_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM blocks b
         WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
            OR (b.blocker_id = u.id AND b.blocked_id = $1)
       )
     ORDER BY l.created_at DESC
     LIMIT 100`,
    [userId]
  );
  const likes = await Promise.all(
    rows.rows.map(async (row) => ({
      profile: await serializePublicProfile(row, viewer),
      likedAt: row.liked_at,
    }))
  );
  return { likes, count: likes.length };
}

export async function getMatchOrThrow(userId: string, matchId: string): Promise<MatchRow> {
  return getMatchForUser(matchId, userId);
}
