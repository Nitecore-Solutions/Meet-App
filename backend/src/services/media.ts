import os from "node:os";
import path from "node:path";
import fsp from "node:fs/promises";
import type {
  MediaKind,
  MediaPurpose,
  MediaRow,
  MediaStatus,
  UserPhotoRow,
  UserRow,
} from "../domain/types";
import { config } from "../config";
import { query, queryOne, withTransaction } from "../db";
import {
  addHoursIso,
  addMinutesIso,
  nowIso,
  randomId,
} from "../utils/crypto";
import {
  AppError,
  badRequest,
  conflict,
  gone,
  notFound,
  unprocessable,
} from "../utils/errors";
import { logger } from "../utils/logger";
import {
  storage,
  type UploadTarget,
} from "./storage";
import { probeVideoDuration } from "./video";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export type SerializedMedia = {
  id: string;
  kind: MediaKind;
  purpose: MediaPurpose;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  durationVerified: boolean;
  status: MediaStatus;
  url: string | null;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  deletedAt: string | null;
};

export type MediaUploadInput = {
  purpose: MediaPurpose;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
  fileName?: string;
};

export type MediaUploadResult = {
  media: SerializedMedia;
  upload: UploadTarget;
};

export type UserPhoto = {
  photoId: string;
  mediaId: string;
  position: number;
  kind: MediaKind;
  status: MediaStatus;
  url: string | null;
  mimeType: string;
  createdAt: string;
};

function normalizeMimeType(mimeType: string) {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (normalized === "image/jpg") return "image/jpeg";
  if (normalized === "video/mov") return "video/quicktime";
  return normalized;
}

function kindForMimeType(mimeType: string): MediaKind | null {
  if (IMAGE_MIME_TYPES.has(mimeType)) return "image";
  if (VIDEO_MIME_TYPES.has(mimeType)) return "video";
  return null;
}

function extensionForMimeType(mimeType: string) {
  return EXTENSIONS[mimeType] ?? "bin";
}

function mediaLimit(kind: MediaKind) {
  return kind === "image" ? config.media.maxImageBytes : config.media.maxVideoBytes;
}

function validateInput(input: MediaUploadInput) {
  const mimeType = normalizeMimeType(input.mimeType);
  const kind = kindForMimeType(mimeType);
  if (!kind) {
    throw badRequest(
      "UNSUPPORTED_MEDIA_TYPE",
      "Use a JPG, PNG, WebP or GIF image, or an MP4, MOV or WebM video."
    );
  }
  if (input.purpose !== "chat" && kind !== "image") {
    throw badRequest("UNSUPPORTED_MEDIA_TYPE", "Only images can be used as profile photos.");
  }
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
    throw badRequest("INVALID_MEDIA_SIZE", "A valid file size is required.");
  }
  if (input.sizeBytes > mediaLimit(kind)) {
    throw new AppError(
      413,
      "MEDIA_TOO_LARGE",
      kind === "image"
        ? `Images must be ${Math.round(config.media.maxImageBytes / 1024 / 1024)} MB or smaller.`
        : `Videos must be ${Math.round(config.media.maxVideoBytes / 1024 / 1024)} MB or smaller.`
    );
  }
  if (kind === "video") {
    if (
      input.durationSeconds == null ||
      !Number.isFinite(input.durationSeconds) ||
      input.durationSeconds <= 0
    ) {
      throw badRequest(
        "VIDEO_DURATION_REQUIRED",
        "Send the video duration so we can enforce the one-minute limit."
      );
    }
    if (input.durationSeconds > config.media.maxVideoDurationSeconds + 1) {
      throw unprocessable(
        "VIDEO_TOO_LONG",
        `Videos can be at most ${config.media.maxVideoDurationSeconds} seconds long.`
      );
    }
  }
  return { mimeType, kind };
}

function effectiveStatus(row: MediaRow): MediaStatus {
  if (
    row.status === "ready" &&
    row.expires_at &&
    new Date(row.expires_at).getTime() <= Date.now()
  ) {
    return "deleted";
  }
  return row.status;
}

export async function serializeMedia(row: MediaRow): Promise<SerializedMedia> {
  const status = effectiveStatus(row);
  const url =
    status === "ready" && row.storage_key
      ? await storage.getDownloadUrl(row.storage_key, row.mime_type)
      : null;
  return {
    id: row.id,
    kind: row.kind,
    purpose: row.purpose,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    durationSeconds: row.duration_seconds,
    durationVerified: row.duration_verified,
    status,
    url,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
    deletedAt: row.deleted_at,
  };
}

export async function getMediaRow(id: string) {
  return queryOne<MediaRow>("SELECT * FROM media WHERE id = $1", [id]);
}

async function markDeleted(row: MediaRow) {
  if (row.storage_key) {
    try {
      await storage.delete(row.storage_key);
    } catch (error) {
      logger.warn("Could not delete media object from storage", {
        mediaId: row.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  await query(
    `UPDATE media
     SET status = 'deleted', storage_key = NULL, deleted_at = $1
     WHERE id = $2`,
    [nowIso(), row.id]
  );
}

export async function initMediaUploads(
  userId: string,
  inputs: MediaUploadInput[]
): Promise<MediaUploadResult[]> {
  if (inputs.length === 0) {
    throw badRequest("NO_FILES", "Choose at least one file to upload.");
  }
  if (inputs.length > 10) {
    throw badRequest("TOO_MANY_FILES", "Upload at most 10 files at a time.");
  }

  const prepared = inputs.map((input) => ({ input, ...validateInput(input) }));
  const results: MediaUploadResult[] = [];

  for (const item of prepared) {
    const id = randomId();
    const storageKey = `${item.input.purpose}/${userId}/${id}.${extensionForMimeType(item.mimeType)}`;
    const createdAt = nowIso();
    const upload = await storage.createUploadUrl(storageKey, item.mimeType).catch((error) => {
      logger.error("Could not create media upload URL", {
        mediaId: id,
        message: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(502, "UPLOAD_UNAVAILABLE", "Media storage is not available right now.");
    });

    const row = await queryOne<MediaRow>(
      `INSERT INTO media
        (id, owner_id, purpose, kind, storage_driver, storage_key, mime_type, size_bytes,
         declared_duration_seconds, duration_seconds, duration_verified, status, created_at,
         completed_at, expires_at, deleted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,FALSE,'pending',$10,NULL,NULL,NULL)
       RETURNING *`,
      [
        id,
        userId,
        item.input.purpose,
        item.kind,
        storage.driver,
        storageKey,
        item.mimeType,
        item.input.sizeBytes,
        item.input.durationSeconds ?? null,
        createdAt,
      ]
    );
    if (!row) throw new AppError(500, "MEDIA_CREATE_FAILED", "Could not prepare the upload.");

    results.push({ media: await serializeMedia(row), upload });
  }

  return results;
}

function detectMediaFamily(head: Buffer): { kind: MediaKind; mimeType: string } | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return { kind: "image", mimeType: "image/jpeg" };
  }
  if (
    head.length >= 8 &&
    head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { kind: "image", mimeType: "image/png" };
  }
  if (head.length >= 6) {
    const signature = head.subarray(0, 6).toString("ascii");
    if (signature === "GIF87a" || signature === "GIF89a") {
      return { kind: "image", mimeType: "image/gif" };
    }
  }
  if (
    head.length >= 12 &&
    head.subarray(0, 4).toString("ascii") === "RIFF" &&
    head.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { kind: "image", mimeType: "image/webp" };
  }
  if (head.length >= 12 && head.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = head.subarray(8, 12).toString("ascii").toLowerCase();
    return {
      kind: "video",
      mimeType: brand.startsWith("qt") ? "video/quicktime" : "video/mp4",
    };
  }
  if (head.length >= 4 && head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    return { kind: "video", mimeType: "video/webm" };
  }
  return null;
}

async function rejectUpload(row: MediaRow, code: string, message: string): Promise<never> {
  await markDeleted(row);
  throw unprocessable(code, message);
}

export async function completeMediaUpload(
  userId: string,
  mediaId: string
): Promise<SerializedMedia> {
  const row = await getMediaRow(mediaId);
  if (!row || row.owner_id !== userId) {
    throw notFound("MEDIA_NOT_FOUND", "That upload could not be found.");
  }
  if (row.status === "deleted") {
    throw gone("MEDIA_DELETED", "This media item is no longer available.");
  }
  if (row.status === "ready") return serializeMedia(row);
  if (!row.storage_key) {
    throw gone("MEDIA_UPLOAD_EXPIRED", "This upload link has expired.");
  }
  if (new Date(row.created_at).getTime() < Date.now() - config.media.pendingUploadTtlMinutes * 60_000) {
    await markDeleted(row);
    throw gone("MEDIA_UPLOAD_EXPIRED", "This upload link has expired.");
  }

  const stored = await storage.stat(row.storage_key);
  if (!stored) {
    throw conflict("UPLOAD_INCOMPLETE", "Upload the file before completing this media item.");
  }
  if (stored.size <= 0) {
    await rejectUpload(row, "EMPTY_UPLOAD", "The uploaded file is empty.");
  }
  if (stored.size > mediaLimit(row.kind)) {
    await rejectUpload(
      row,
      "MEDIA_TOO_LARGE",
      row.kind === "image"
        ? `Images must be ${Math.round(config.media.maxImageBytes / 1024 / 1024)} MB or smaller.`
        : `Videos must be ${Math.round(config.media.maxVideoBytes / 1024 / 1024)} MB or smaller.`
    );
  }

  const head = await storage.readHead(row.storage_key, 64);
  const detected = detectMediaFamily(head);
  if (!detected || detected.kind !== row.kind) {
    await rejectUpload(row, "INVALID_MEDIA", "The uploaded file does not match its media type.");
  }

  let duration: number | null = null;
  let durationVerified = false;
  let expiresAt: string | null = null;

  if (row.kind === "video") {
    const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), "pagalpagal-video-"));
    const tempFile = path.join(tempDir, "probe-input");
    try {
      await storage.downloadToFile(row.storage_key, tempFile);
      const probed = await probeVideoDuration(tempFile);
      if (probed != null) {
        duration = probed;
        durationVerified = true;
      } else if (row.declared_duration_seconds != null) {
        duration = row.declared_duration_seconds;
      }
    } finally {
      await fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }

    if (config.media.requireVideoProbe && !durationVerified) {
      await rejectUpload(
        row,
        "VIDEO_PROBE_REQUIRED",
        "We could not verify this video. Install ffprobe on the server or try a different file."
      );
    }
    if (duration == null || !Number.isFinite(duration) || duration <= 0) {
      await markDeleted(row);
      throw unprocessable("VIDEO_DURATION_REQUIRED", "The video duration could not be verified.");
    }
    if (duration > config.media.maxVideoDurationSeconds + 1) {
      await markDeleted(row);
      throw unprocessable(
        "VIDEO_TOO_LONG",
        `Videos can be at most ${config.media.maxVideoDurationSeconds} seconds long.`
      );
    }
    expiresAt = addHoursIso(config.media.videoRetentionHours);
  }

  const updated = await queryOne<MediaRow>(
    `UPDATE media SET
       status = 'ready',
       size_bytes = $1,
       duration_seconds = $2,
       duration_verified = $3,
       completed_at = $4,
       expires_at = $5
     WHERE id = $6
     RETURNING *`,
    [stored.size, duration, durationVerified, nowIso(), expiresAt, row.id]
  );
  if (!updated) throw new AppError(500, "MEDIA_UPDATE_FAILED", "Could not finalize this upload.");
  logger.info("Media upload completed", {
    mediaId: updated.id,
    kind: updated.kind,
    sizeBytes: updated.size_bytes,
    durationSeconds: updated.duration_seconds,
    expiresAt: updated.expires_at,
  });
  return serializeMedia(updated);
}

export async function cleanupExpiredMedia() {
  const now = nowIso();
  const pendingBefore = addMinutesIso(-config.media.pendingUploadTtlMinutes);
  const expired = await query<MediaRow>(
    `SELECT * FROM media
     WHERE (status = 'ready' AND expires_at IS NOT NULL AND expires_at <= $1)
        OR (status = 'pending' AND created_at <= $2)`,
    [now, pendingBefore]
  );

  let deleted = 0;
  for (const row of expired.rows) {
    if (row.storage_key) {
      try {
        await storage.delete(row.storage_key);
      } catch (error) {
        logger.warn("Media cleanup could not delete object; will retry", {
          mediaId: row.id,
          message: error instanceof Error ? error.message : String(error),
        });
        continue;
      }
    }
    await query(
      `UPDATE media
       SET status = 'deleted', storage_key = NULL, deleted_at = $1
       WHERE id = $2`,
      [now, row.id]
    );
    deleted += 1;
  }

  if (deleted > 0) {
    logger.info("Expired media cleaned up", { deleted });
  }
  return { deleted };
}

export async function getAvatarForUser(user: UserRow) {
  if (user.avatar_media_id) {
    const media = await getMediaRow(user.avatar_media_id);
    if (media && effectiveStatus(media) === "ready" && media.storage_key) {
      return {
        id: media.id,
        url: await storage.getDownloadUrl(media.storage_key, media.mime_type),
        kind: media.kind,
      };
    }
  }
  if (user.avatar_url) return { id: null, url: user.avatar_url, kind: "image" as const };
  return null;
}

export async function listUserPhotos(userId: string): Promise<UserPhoto[]> {
  const rows = await query<MediaRow & { photo_id: string; photo_position: number; photo_created_at: string }>(
    `SELECT m.*, up.id AS photo_id, up.position AS photo_position, up.created_at AS photo_created_at
     FROM user_photos up
     JOIN media m ON m.id = up.media_id
     WHERE up.user_id = $1
     ORDER BY up.position ASC`,
    [userId]
  );
  const photos: UserPhoto[] = [];
  for (const row of rows.rows) {
    const media = await serializeMedia(row);
    if (media.status !== "ready") continue;
    photos.push({
      photoId: row.photo_id,
      mediaId: row.id,
      position: row.photo_position,
      kind: row.kind,
      status: media.status,
      url: media.url,
      mimeType: row.mime_type,
      createdAt: row.photo_created_at,
    });
  }
  return photos;
}

export async function attachUserPhotos(userId: string, mediaIds: string[]) {
  if (mediaIds.length === 0) {
    throw badRequest("NO_MEDIA", "Choose at least one uploaded photo.");
  }
  const uniqueIds = [...new Set(mediaIds)];
  const existing = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM user_photos WHERE user_id = $1",
    [userId]
  );
  const existingCount = Number(existing?.count ?? 0);
  if (existingCount + uniqueIds.length > config.media.galleryMaxPhotos) {
    throw conflict(
      "PHOTO_LIMIT_REACHED",
      `Your profile can have at most ${config.media.galleryMaxPhotos} photos.`
    );
  }

  const valid: MediaRow[] = [];
  for (const id of uniqueIds) {
    const media = await getMediaRow(id);
    if (!media || media.owner_id !== userId) {
      throw notFound("MEDIA_NOT_FOUND", "One of those photos could not be found.");
    }
    if (media.purpose !== "gallery") {
      throw badRequest("INVALID_MEDIA_PURPOSE", "That upload was not prepared as a profile photo.");
    }
    if (media.kind !== "image" || effectiveStatus(media) !== "ready") {
      throw badRequest("INVALID_PHOTO", "That upload is not a ready profile photo.");
    }
    const attached = await queryOne<{ id: string }>(
      "SELECT id FROM user_photos WHERE media_id = $1",
      [id]
    );
    if (attached) throw conflict("PHOTO_ALREADY_ATTACHED", "That photo is already in your profile.");
    valid.push(media);
  }

  let nextPosition = existingCount;
  await withTransaction(async (tx) => {
    for (const media of valid) {
      nextPosition += 1;
      await tx.query(
        `INSERT INTO user_photos (id, user_id, media_id, position, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomId(), userId, media.id, nextPosition, nowIso()]
      );
    }
    await tx.query("UPDATE users SET updated_at = $1 WHERE id = $2", [nowIso(), userId]);
  });

  return listUserPhotos(userId);
}

export async function reorderUserPhotos(userId: string, mediaIds: string[]) {
  const current = await query<UserPhotoRow>(
    "SELECT * FROM user_photos WHERE user_id = $1 ORDER BY position ASC",
    [userId]
  );
  if (current.rows.length !== mediaIds.length) {
    throw badRequest("INVALID_PHOTO_ORDER", "Send every photo exactly once when reordering.");
  }
  const currentIds = new Set(current.rows.map((row) => row.media_id));
  const requested = new Set(mediaIds);
  if (requested.size !== mediaIds.length || [...currentIds].some((id) => !requested.has(id))) {
    throw badRequest("INVALID_PHOTO_ORDER", "Send every photo exactly once when reordering.");
  }

  // Update positions in place so photo IDs stay stable for clients. Use a
  // temporary offset first because (user_id, position) is uniquely indexed and
  // a direct reorder can collide with a row that has not been moved yet.
  const offset = 1_000_000;
  await withTransaction(async (tx) => {
    for (const [index, mediaId] of mediaIds.entries()) {
      await tx.query(
        "UPDATE user_photos SET position = $1 WHERE user_id = $2 AND media_id = $3",
        [offset + index + 1, userId, mediaId]
      );
    }
    for (const [index, mediaId] of mediaIds.entries()) {
      await tx.query(
        "UPDATE user_photos SET position = $1 WHERE user_id = $2 AND media_id = $3",
        [index + 1, userId, mediaId]
      );
    }
    await tx.query("UPDATE users SET updated_at = $1 WHERE id = $2", [nowIso(), userId]);
  });

  return listUserPhotos(userId);
}

export async function deleteUserPhoto(userId: string, photoId: string) {
  const photo = await queryOne<UserPhotoRow>(
    "SELECT * FROM user_photos WHERE id = $1 AND user_id = $2",
    [photoId, userId]
  );
  if (!photo) throw notFound("PHOTO_NOT_FOUND", "That profile photo could not be found.");

  await query("DELETE FROM user_photos WHERE id = $1", [photo.id]);
  await query(
    "UPDATE users SET avatar_media_id = NULL, updated_at = $1 WHERE id = $2 AND avatar_media_id = $3",
    [nowIso(), userId, photo.media_id]
  );
  const media = await getMediaRow(photo.media_id);
  if (media) await markDeleted(media);
  return { removed: true };
}

export async function setUserAvatar(userId: string, mediaId: string) {
  const media = await getMediaRow(mediaId);
  if (!media || media.owner_id !== userId) {
    throw notFound("MEDIA_NOT_FOUND", "That photo could not be found.");
  }
  if (media.purpose !== "avatar") {
    throw badRequest("INVALID_MEDIA_PURPOSE", "That upload was not prepared as an avatar.");
  }
  if (media.kind !== "image" || effectiveStatus(media) !== "ready") {
    throw badRequest("INVALID_AVATAR", "That upload is not a ready image.");
  }
  await query("UPDATE users SET avatar_media_id = $1, updated_at = $2 WHERE id = $3", [
    media.id,
    nowIso(),
    userId,
  ]);
  return serializeMedia(media);
}
