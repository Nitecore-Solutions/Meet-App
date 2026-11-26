import { query, queryOne, withTransaction } from "../db";
import type { MatchRow, MediaRow, MessageRow, UserRow } from "../domain/types";
import { nowIso, randomId } from "../utils/crypto";
import { badRequest, gone, notFound } from "../utils/errors";
import { realtimeBus } from "../realtime/events";
import { getMediaRow, serializeMedia, type SerializedMedia } from "./media";
import { findUserById, requireUserById, serializePublicProfile, type PublicProfile } from "./users";

export type MessageType = "text" | "image" | "video";

export type SerializedMessage = {
  id: string;
  matchId: string;
  senderId: string;
  mine: boolean;
  type: MessageType;
  text: string | null;
  media: SerializedMedia | null;
  clientId: string | null;
  createdAt: string;
  readAt: string | null;
};

export type SerializedConversation = {
  id: string;
  profileId: string;
  profile: PublicProfile;
  lastMessage: SerializedMessage | null;
  unread: number;
  newMatch: boolean;
  updatedAt: string;
  createdAt: string;
};

export type SendMessageInput = {
  type?: MessageType;
  text?: string;
  mediaId?: string;
  clientId?: string;
};

function participantIds(match: MatchRow) {
  return [match.user_a_id, match.user_b_id];
}

function otherUserId(match: MatchRow, userId: string) {
  return match.user_a_id === userId ? match.user_b_id : match.user_a_id;
}

function pairIds(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getMatchForUser(matchId: string, userId: string) {
  const match = await queryOne<MatchRow>(
    `SELECT * FROM matches
     WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
    [matchId, userId]
  );
  if (!match) throw notFound("MATCH_NOT_FOUND", "That conversation could not be found.");
  return match;
}

export async function getMatchBetween(userA: string, userB: string) {
  const [a, b] = pairIds(userA, userB);
  return queryOne<MatchRow>(
    "SELECT * FROM matches WHERE user_a_id = $1 AND user_b_id = $2",
    [a, b]
  );
}

export async function createMatchForPair(userA: string, userB: string) {
  if (userA === userB) throw badRequest("INVALID_MATCH", "You cannot match with yourself.");
  const [a, b] = pairIds(userA, userB);
  const created = await queryOne<MatchRow>(
    `INSERT INTO matches (id, user_a_id, user_b_id, created_at, last_message_at)
     VALUES ($1, $2, $3, $4, NULL)
     ON CONFLICT (user_a_id, user_b_id) DO NOTHING
     RETURNING *`,
    [randomId(), a, b, nowIso()]
  );
  const match =
    created ??
    (await queryOne<MatchRow>(
      "SELECT * FROM matches WHERE user_a_id = $1 AND user_b_id = $2",
      [a, b]
    ));
  if (!match) throw new Error("Could not create match");
  if (created) {
    realtimeBus.emitEvent({
      type: "match",
      matchId: match.id,
      participantIds: participantIds(match),
    });
  }
  return match;
}

async function serializeMessage(row: MessageRow, viewerId: string): Promise<SerializedMessage> {
  let media: SerializedMedia | null = null;
  if (row.media_id) {
    const mediaRow = await getMediaRow(row.media_id);
    if (mediaRow) media = await serializeMedia(mediaRow);
  }
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    mine: row.sender_id === viewerId,
    type: row.type,
    text: row.text,
    media,
    clientId: row.client_id,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

async function assertChatMedia(userId: string, mediaId: string, type: MessageType) {
  const media = await getMediaRow(mediaId);
  if (!media || media.owner_id !== userId) {
    throw notFound("MEDIA_NOT_FOUND", "That attachment could not be found.");
  }
  if (media.purpose !== "chat") {
    throw badRequest("INVALID_MEDIA_PURPOSE", "That upload was not prepared for chat.");
  }
  if (media.status !== "ready") {
    throw gone("MEDIA_NOT_READY", "That attachment is not ready to send.");
  }
  if (media.kind !== type) {
    throw badRequest("MEDIA_TYPE_MISMATCH", "The attachment does not match the message type.");
  }
  if (media.expires_at && new Date(media.expires_at).getTime() <= Date.now()) {
    throw gone("MEDIA_EXPIRED", "That video has expired. Videos are available for 8 hours.");
  }
  return media as MediaRow;
}

export async function sendMessage(
  userId: string,
  matchId: string,
  input: SendMessageInput
): Promise<SerializedMessage> {
  const match = await getMatchForUser(matchId, userId);
  const type: MessageType = input.type ?? "text";
  if (!["text", "image", "video"].includes(type)) {
    throw badRequest("INVALID_MESSAGE_TYPE", "Messages must be text, image or video.");
  }

  const clientId = input.clientId?.trim().slice(0, 100) || null;
  if (clientId) {
    const existing = await queryOne<MessageRow>(
      "SELECT * FROM messages WHERE sender_id = $1 AND match_id = $2 AND client_id = $3",
      [userId, matchId, clientId]
    );
    if (existing) return serializeMessage(existing, userId);
  }

  let text: string | null = null;
  let mediaId: string | null = null;
  if (type === "text") {
    text = input.text?.trim() ?? "";
    if (!text) throw badRequest("EMPTY_MESSAGE", "Write a message before sending.");
    if (text.length > 2000) {
      throw badRequest("MESSAGE_TOO_LONG", "Messages can be at most 2000 characters.");
    }
  } else {
    if (!input.mediaId) {
      throw badRequest("MEDIA_REQUIRED", "Choose an attachment to send.");
    }
    await assertChatMedia(userId, input.mediaId, type);
    mediaId = input.mediaId;
    const caption = input.text?.trim();
    if (caption) {
      if (caption.length > 500) {
        throw badRequest("MESSAGE_TOO_LONG", "Captions can be at most 500 characters.");
      }
      text = caption;
    }
  }

  const createdAt = nowIso();
  const row = await withTransaction(async (tx) => {
    const inserted = await tx.query<MessageRow>(
      `INSERT INTO messages
        (id, match_id, sender_id, type, text, media_id, client_id, created_at, read_at, deleted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NULL)
       RETURNING *`,
      [randomId(), matchId, userId, type, text, mediaId, clientId, createdAt]
    );
    await tx.query("UPDATE matches SET last_message_at = $1 WHERE id = $2", [createdAt, matchId]);
    await tx.query(
      `INSERT INTO read_states (match_id, user_id, last_read_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (match_id, user_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at`,
      [matchId, userId, createdAt]
    );
    const message = inserted.rows[0];
    if (!message) throw new Error("Could not save message");
    return message;
  });

  const message = await serializeMessage(row, userId);
  realtimeBus.emitEvent({
    type: "message",
    matchId,
    participantIds: participantIds(match),
    message,
  });
  return message;
}

export async function listConversations(userId: string) {
  await requireUserById(userId);
  const rows = await query<MatchRow>(
    `SELECT * FROM matches
     WHERE user_a_id = $1 OR user_b_id = $1
     ORDER BY COALESCE(last_message_at, created_at) DESC
     LIMIT 100`,
    [userId]
  );

  const conversations: SerializedConversation[] = [];
  for (const match of rows.rows) {
    const otherId = otherUserId(match, userId);
    const other = await findUserById(otherId);
    if (!other) continue;
    const lastRow = await queryOne<MessageRow>(
      `SELECT * FROM messages
       WHERE match_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [match.id]
    );
    const unread = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM messages
       WHERE match_id = $1 AND sender_id <> $2 AND read_at IS NULL AND deleted_at IS NULL`,
      [match.id, userId]
    );
    conversations.push({
      id: match.id,
      profileId: other.id,
      profile: await serializePublicProfile(other, await requireUserById(userId)),
      lastMessage: lastRow ? await serializeMessage(lastRow, userId) : null,
      unread: Number(unread?.count ?? 0),
      newMatch: lastRow == null,
      updatedAt: match.last_message_at ?? match.created_at,
      createdAt: match.created_at,
    });
  }

  return {
    conversations,
    unreadCount: conversations.reduce((total, item) => total + item.unread, 0),
  };
}

export async function listMessages(
  userId: string,
  matchId: string,
  options: { before?: string; limit?: number } = {}
) {
  await getMatchForUser(matchId, userId);
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const params: unknown[] = [matchId];
  let beforeClause = "";
  if (options.before) {
    params.push(options.before);
    beforeClause = `AND created_at < $${params.length}`;
  }
  params.push(limit);
  const rows = await query<MessageRow>(
    `SELECT * FROM messages
     WHERE match_id = $1 ${beforeClause} AND deleted_at IS NULL
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length}`,
    params
  );
  const chronological = [...rows.rows].reverse();
  const messages = await Promise.all(chronological.map((row) => serializeMessage(row, userId)));
  return {
    messages,
    nextBefore:
      rows.rows.length === limit ? chronological[0]?.created_at ?? null : null,
  };
}

export async function markRead(userId: string, matchId: string) {
  const match = await getMatchForUser(matchId, userId);
  const readAt = nowIso();
  const updated = await query(
    `UPDATE messages SET read_at = $1
     WHERE match_id = $2 AND sender_id <> $3 AND read_at IS NULL AND deleted_at IS NULL`,
    [readAt, matchId, userId]
  );
  await query(
    `INSERT INTO read_states (match_id, user_id, last_read_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (match_id, user_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at`,
    [matchId, userId, readAt]
  );
  if (updated.rowCount > 0) {
    realtimeBus.emitEvent({
      type: "read",
      matchId,
      participantIds: participantIds(match),
      readerId: userId,
      readAt,
    });
  }
  return { readAt, marked: updated.rowCount };
}

export async function emitTyping(userId: string, matchId: string, typing: boolean) {
  const match = await getMatchForUser(matchId, userId);
  realtimeBus.emitEvent({
    type: "typing",
    matchId,
    participantIds: participantIds(match),
    userId,
    typing: Boolean(typing),
  });
}

export async function unmatch(userId: string, matchId: string) {
  const match = await getMatchForUser(matchId, userId);
  await query("DELETE FROM matches WHERE id = $1", [matchId]);
  realtimeBus.emitEvent({
    type: "match:removed",
    matchId,
    participantIds: participantIds(match),
  });
  return { removed: true };
}

export async function getConversationWithUser(userId: string, otherId: string) {
  const other = await requireUserById(otherId);
  const match = await getMatchBetween(userId, other.id);
  if (!match) throw notFound("MATCH_NOT_FOUND", "You need to match before you can chat.");
  return {
    id: match.id,
    profile: await serializePublicProfile(other, await requireUserById(userId)),
  };
}

export function matchParticipantIds(match: MatchRow) {
  return participantIds(match);
}

export function matchOtherUserId(match: MatchRow, userId: string) {
  return otherUserId(match, userId);
}

export async function ensureMatchRealtimeAccess(userId: string, matchId: string) {
  return getMatchForUser(matchId, userId);
}

export async function userSummary(user: UserRow) {
  return serializePublicProfile(user);
}
