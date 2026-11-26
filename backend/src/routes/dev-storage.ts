import fs from "node:fs";
import type { Request, Response } from "express";
import { config } from "../config";
import {
  openLocalDownload,
  verifyLocalStorageToken,
  writeLocalUpload,
} from "../services/storage";
import { AppError, badRequest } from "../utils/errors";

function tokenFromQuery(req: Request) {
  const token = req.query.token;
  if (typeof token !== "string" || !token) {
    throw badRequest("TOKEN_REQUIRED", "A storage token is required.");
  }
  return token;
}

function uploadLimitForMime(mimeType: string) {
  return mimeType.startsWith("video/")
    ? config.media.maxVideoBytes
    : config.media.maxImageBytes;
}

export async function devStorageUpload(req: Request, res: Response) {
  const payload = verifyLocalStorageToken(tokenFromQuery(req), "upload");
  const body = req.body;
  if (!Buffer.isBuffer(body)) {
    throw badRequest("INVALID_UPLOAD", "Send the raw file bytes as the request body.");
  }
  if (body.length === 0) throw badRequest("EMPTY_UPLOAD", "The uploaded file is empty.");

  const headerType = (req.header("content-type") ?? "").split(";")[0]?.trim().toLowerCase();
  const expectedType = payload.mime?.toLowerCase();
  if (headerType && expectedType && headerType !== expectedType) {
    throw badRequest("CONTENT_TYPE_MISMATCH", "The upload content type does not match the signed URL.");
  }
  const mimeType = expectedType ?? headerType ?? "application/octet-stream";
  const limit = uploadLimitForMime(mimeType);
  if (body.length > limit) {
    throw new AppError(413, "MEDIA_TOO_LARGE", "The uploaded file is larger than the allowed limit.");
  }

  await writeLocalUpload(payload.key, body);
  res.status(201).json({ ok: true, sizeBytes: body.length, mimeType });
}

export async function devStorageDownload(req: Request, res: Response) {
  const payload = verifyLocalStorageToken(tokenFromQuery(req), "download");
  const file = await openLocalDownload(payload.key);
  res.setHeader("Content-Type", payload.mime ?? "application/octet-stream");
  res.setHeader("Content-Length", String(file.size));
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", "private, max-age=300");
  const stream = fs.createReadStream(file.filePath);
  stream.on("error", (error) => {
    if (!res.headersSent) {
      res.status(500).json({
        error: { code: "MEDIA_READ_FAILED", message: "Could not read the media file." },
      });
    } else {
      res.destroy(error);
    }
  });
  stream.pipe(res);
}
