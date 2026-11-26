import { Router } from "express";
import { z } from "zod";
import { authUser, requireAuth } from "../middleware/auth";
import {
  attachUserPhotos,
  deleteUserPhoto,
  listUserPhotos,
  reorderUserPhotos,
  setUserAvatar,
} from "../services/media";
import {
  blockUser,
  getSocialState,
  likeUser,
  listIncomingLikes,
  passUser,
  unblockUser,
} from "../services/social";
import {
  discoverProfiles,
  getOwnProfile,
  getPublicProfile,
  updateUser,
  type UserUpdate,
} from "../services/users";
import { parseBody, parseQuery } from "../utils/validate";

export const usersRouter = Router();
export const discoverRouter = Router();
export const likesRouter = Router();

usersRouter.use(requireAuth);
discoverRouter.use(requireAuth);
likesRouter.use(requireAuth);

const optionalText = (max: number) =>
  z.union([z.string().trim().max(max), z.null()]).optional();

const profileSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(80).optional(),
    age: z.union([z.number().int().min(18).max(120), z.null()]).optional(),
    gender: z.union([z.enum(["woman", "man", "other"]), z.null()]).optional(),
    city: optionalText(100),
    state: optionalText(100),
    bio: optionalText(1000),
    relationshipStatus: optionalText(80),
    lookingFor: optionalText(120),
    profession: optionalText(120),
    education: optionalText(120),
    drinking: optionalText(40),
    smoking: optionalText(40),
    eating: optionalText(40),
    zodiac: optionalText(40),
    languages: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    interests: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    interestedIn: z.union([z.enum(["women", "men", "everyone"]), z.null()]).optional(),
    minAge: z.number().int().min(18).max(99).optional(),
    maxAge: z.number().int().min(18).max(99).optional(),
    showPhotosOnly: z.boolean().optional(),
    showOtherCities: z.boolean().optional(),
    radiusKm: z.number().int().min(1).max(500).optional(),
    hiddenFields: z.record(z.string(), z.boolean()).optional(),
    latitude: z.union([z.number().min(-90).max(90), z.null()]).optional(),
    longitude: z.union([z.number().min(-180).max(180), z.null()]).optional(),
  })
  .refine(
    (value) => value.minAge == null || value.maxAge == null || value.minAge <= value.maxAge,
    { message: "Minimum age cannot be greater than maximum age.", path: ["minAge"] }
  );

const photosSchema = z.object({
  mediaIds: z.array(z.string().trim().min(1)).min(1).max(10),
});

const avatarSchema = z.object({
  mediaId: z.string().trim().min(1),
});

const idSchema = z.object({
  id: z.string().trim().min(1).max(64),
});

const photoIdSchema = z.object({
  photoId: z.string().trim().min(1).max(64),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  minAge: z.coerce.number().int().min(18).max(99).optional(),
  maxAge: z.coerce.number().int().min(18).max(99).optional(),
  city: z.string().trim().max(100).optional(),
  showPhotosOnly: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((value) => (value == null ? undefined : value === "true" || value === "1")),
  showOtherCities: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((value) => (value == null ? undefined : value === "true" || value === "1")),
});

usersRouter.get("/me", async (req, res) => {
  const user = authUser(req);
  res.json({ user: await getOwnProfile(user.id) });
});

usersRouter.patch("/me", async (req, res) => {
  const user = authUser(req);
  const patch = parseBody(profileSchema, req.body) as UserUpdate;
  res.json({ user: await updateUser(user.id, patch) });
});

usersRouter.get("/me/photos", async (req, res) => {
  const user = authUser(req);
  res.json({ photos: await listUserPhotos(user.id) });
});

usersRouter.post("/me/photos", async (req, res) => {
  const user = authUser(req);
  const { mediaIds } = parseBody(photosSchema, req.body);
  res.status(201).json({ photos: await attachUserPhotos(user.id, mediaIds) });
});

usersRouter.patch("/me/photos/order", async (req, res) => {
  const user = authUser(req);
  const { mediaIds } = parseBody(photosSchema, req.body);
  res.json({ photos: await reorderUserPhotos(user.id, mediaIds) });
});

usersRouter.delete("/me/photos/:photoId", async (req, res) => {
  const user = authUser(req);
  const { photoId } = parseBody(photoIdSchema, req.params);
  await deleteUserPhoto(user.id, photoId);
  res.json({ removed: true, photos: await listUserPhotos(user.id) });
});

usersRouter.put("/me/avatar", async (req, res) => {
  const user = authUser(req);
  const { mediaId } = parseBody(avatarSchema, req.body);
  const media = await setUserAvatar(user.id, mediaId);
  res.json({ avatar: media, user: await getOwnProfile(user.id) });
});

usersRouter.get("/:id", async (req, res) => {
  const viewer = authUser(req);
  const { id } = parseBody(idSchema, req.params);
  const [profile, state] = await Promise.all([
    getPublicProfile(id, viewer.id),
    getSocialState(viewer.id, id),
  ]);
  res.json({ profile, state });
});

usersRouter.get("/:id/state", async (req, res) => {
  const viewer = authUser(req);
  const { id } = parseBody(idSchema, req.params);
  res.json({ state: await getSocialState(viewer.id, id) });
});

usersRouter.post("/:id/like", async (req, res) => {
  const viewer = authUser(req);
  const { id } = parseBody(idSchema, req.params);
  res.json(await likeUser(viewer.id, id));
});

usersRouter.post("/:id/pass", async (req, res) => {
  const viewer = authUser(req);
  const { id } = parseBody(idSchema, req.params);
  res.json(await passUser(viewer.id, id));
});

usersRouter.post("/:id/block", async (req, res) => {
  const viewer = authUser(req);
  const { id } = parseBody(idSchema, req.params);
  res.json(await blockUser(viewer.id, id));
});

usersRouter.delete("/:id/block", async (req, res) => {
  const viewer = authUser(req);
  const { id } = parseBody(idSchema, req.params);
  res.json(await unblockUser(viewer.id, id));
});

discoverRouter.get("/", async (req, res) => {
  const viewer = authUser(req);
  const query = parseQuery(paginationSchema, req.query);
  res.json(await discoverProfiles(viewer.id, query));
});

likesRouter.get("/", async (req, res) => {
  const viewer = authUser(req);
  res.json(await listIncomingLikes(viewer.id));
});
