import { Router } from "express";
import { z } from "zod";
import { authUser, requireAuth } from "../middleware/auth";
import {
  emitTyping,
  getConversationWithUser,
  getMatchForUser,
  listConversations,
  listMessages,
  markRead,
  sendMessage,
  unmatch,
  type MessageType,
} from "../services/chat";
import { parseBody, parseQuery } from "../utils/validate";

export const chatRouter = Router();
chatRouter.use(requireAuth);

const idSchema = z.object({
  matchId: z.string().trim().min(1).max(64),
});

const userParamsSchema = z.object({
  userId: z.string().trim().min(1).max(64),
});

const messagesQuerySchema = z.object({
  before: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const messageSchema = z.object({
  type: z.enum(["text", "image", "video"]).optional(),
  text: z.string().max(2000).optional(),
  mediaId: z.string().trim().min(1).max(64).optional(),
  clientId: z.string().trim().min(1).max(100).optional(),
});

const typingSchema = z.object({
  typing: z.boolean().optional(),
});

chatRouter.get("/", async (req, res) => {
  const user = authUser(req);
  res.json(await listConversations(user.id));
});

chatRouter.get("/with/:userId", async (req, res) => {
  const user = authUser(req);
  const { userId } = parseBody(userParamsSchema, req.params);
  res.json(await getConversationWithUser(user.id, userId));
});

chatRouter.get("/:matchId/messages", async (req, res) => {
  const user = authUser(req);
  const { matchId } = parseBody(idSchema, req.params);
  const query = parseQuery(messagesQuerySchema, req.query);
  res.json(await listMessages(user.id, matchId, query));
});

chatRouter.post("/:matchId/messages", async (req, res) => {
  const user = authUser(req);
  const { matchId } = parseBody(idSchema, req.params);
  const input = parseBody(messageSchema, req.body);
  const message = await sendMessage(user.id, matchId, {
    type: input.type as MessageType | undefined,
    text: input.text,
    mediaId: input.mediaId,
    clientId: input.clientId,
  });
  res.status(201).json({ message });
});

chatRouter.post("/:matchId/read", async (req, res) => {
  const user = authUser(req);
  const { matchId } = parseBody(idSchema, req.params);
  res.json(await markRead(user.id, matchId));
});

chatRouter.post("/:matchId/typing", async (req, res) => {
  const user = authUser(req);
  const { matchId } = parseBody(idSchema, req.params);
  const { typing } = parseBody(typingSchema, req.body);
  await getMatchForUser(matchId, user.id);
  await emitTyping(user.id, matchId, typing ?? true);
  res.json({ ok: true });
});

chatRouter.delete("/:matchId", async (req, res) => {
  const user = authUser(req);
  const { matchId } = parseBody(idSchema, req.params);
  res.json(await unmatch(user.id, matchId));
});
