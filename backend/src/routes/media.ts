import { Router } from "express";
import { z } from "zod";
import { authUser, requireAuth } from "../middleware/auth";
import { completeMediaUpload, getMediaRow, initMediaUploads, serializeMedia } from "../services/media";
import { parseBody } from "../utils/validate";
import { notFound } from "../utils/errors";

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

const uploadFileSchema = z.object({
  purpose: z.enum(["avatar", "gallery", "chat"]),
  mimeType: z.string().trim().min(3).max(100),
  sizeBytes: z.number().int().min(1).max(500 * 1024 * 1024),
  durationSeconds: z.number().positive().max(3600).optional(),
  fileName: z.string().trim().max(200).optional(),
});

const uploadSchema = z.object({
  files: z.array(uploadFileSchema).min(1).max(10),
});

const idSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

mediaRouter.post("/uploads", async (req, res) => {
  const user = authUser(req);
  const { files } = parseBody(uploadSchema, req.body);
  const uploads = await initMediaUploads(user.id, files);
  res.status(201).json({ uploads });
});

mediaRouter.post("/:id/complete", async (req, res) => {
  const user = authUser(req);
  const { id } = parseBody(idSchema, req.params);
  res.json({ media: await completeMediaUpload(user.id, id) });
});

mediaRouter.get("/:id", async (req, res) => {
  const user = authUser(req);
  const { id } = parseBody(idSchema, req.params);
  const media = await getMediaRow(id);
  if (!media || media.owner_id !== user.id) {
    throw notFound("MEDIA_NOT_FOUND", "That media item could not be found.");
  }
  res.json({ media: await serializeMedia(media) });
});
