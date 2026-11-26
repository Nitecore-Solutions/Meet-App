import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { realtimeBus, type RealtimeEvent } from "./events";
import { findUserById, touchUser } from "../services/users";
import { verifyAccessToken } from "../services/tokens";
import {
  emitTyping,
  getMatchForUser,
  markRead,
  sendMessage,
  type MessageType,
} from "../services/chat";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

type SocketState = {
  userId: string;
  socket: WebSocket;
  subscriptions: Set<string>;
  isAlive: boolean;
  rateWindowStartedAt: number;
  rateCount: number;
};

const socketsByUser = new Map<string, Set<WebSocket>>();
const stateBySocket = new WeakMap<WebSocket, SocketState>();
let server: WebSocketServer | null = null;
let heartbeat: NodeJS.Timeout | null = null;
let unsubscribeBus: (() => void) | null = null;

function sendJson(socket: WebSocket, payload: unknown) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function sendToUser(userId: string, payload: unknown) {
  const sockets = socketsByUser.get(userId);
  if (!sockets) return;
  for (const socket of sockets) sendJson(socket, payload);
}

function sendToUsers(userIds: string[], payload: unknown) {
  for (const userId of new Set(userIds)) sendToUser(userId, payload);
}

function addSocket(userId: string, socket: WebSocket) {
  const set = socketsByUser.get(userId) ?? new Set<WebSocket>();
  set.add(socket);
  socketsByUser.set(userId, set);
}

function removeSocket(userId: string, socket: WebSocket) {
  const set = socketsByUser.get(userId);
  if (!set) return false;
  set.delete(socket);
  if (set.size === 0) {
    socketsByUser.delete(userId);
    return true;
  }
  return false;
}

function accessTokenFromRequest(request: import("node:http").IncomingMessage) {
  try {
    const url = new URL(request.url ?? "/ws", "http://localhost");
    const fromQuery = url.searchParams.get("token");
    if (fromQuery) return fromQuery;
  } catch {
    // Fall through to the Authorization header.
  }
  const header = request.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(/\s+/, 2);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

async function handleConnection(socket: WebSocket, request: import("node:http").IncomingMessage) {
  const token = accessTokenFromRequest(request);
  if (!token) {
    socket.close(4001, "Authentication required");
    return;
  }
  try {
    const { userId } = verifyAccessToken(token);
    const user = await findUserById(userId);
    if (!user) {
      socket.close(4001, "Account not found");
      return;
    }
    const state: SocketState = {
      userId: user.id,
      socket,
      subscriptions: new Set(),
      isAlive: true,
      rateWindowStartedAt: Date.now(),
      rateCount: 0,
    };
    stateBySocket.set(socket, state);
    addSocket(user.id, socket);
    await touchUser(user.id, true);

    sendJson(socket, {
      type: "ready",
      user: { id: user.id, name: user.name },
      serverTime: new Date().toISOString(),
    });

    socket.on("pong", () => {
      state.isAlive = true;
    });

    socket.on("message", (raw) => {
      void handleSocketMessage(state, raw).catch((error) => {
        if (error instanceof AppError) {
          sendJson(socket, {
            type: "error",
            code: error.code,
            message: error.message,
            details: error.details,
          });
          return;
        }
        logger.error("WebSocket message failed", {
          userId: state.userId,
          message: error instanceof Error ? error.message : String(error),
        });
        sendJson(socket, {
          type: "error",
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again.",
        });
      });
    });

    socket.on("close", () => {
      const last = removeSocket(state.userId, socket);
      if (last) {
        void touchUser(state.userId, false).catch(() => {});
      }
    });

    socket.on("error", (error) => {
      logger.warn("WebSocket socket error", {
        userId: state.userId,
        message: error.message,
      });
    });

    logger.debug("WebSocket connected", { userId: state.userId });
  } catch (error) {
    logger.warn("WebSocket authentication failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    socket.close(4001, "Invalid session");
  }
}

async function handleSocketMessage(state: SocketState, raw: RawData) {
  const now = Date.now();
  if (now - state.rateWindowStartedAt > 10_000) {
    state.rateWindowStartedAt = now;
    state.rateCount = 0;
  }
  state.rateCount += 1;
  if (state.rateCount > 60) {
    throw new AppError(429, "RATE_LIMITED", "Slow down a little.");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw.toString()) as Record<string, unknown>;
  } catch {
    throw new AppError(400, "INVALID_MESSAGE", "Send a valid JSON message.");
  }
  const type = typeof payload.type === "string" ? payload.type : "";

  if (type === "ping") {
    sendJson(state.socket, { type: "pong", at: new Date().toISOString() });
    return;
  }

  if (type === "subscribe" || type === "unsubscribe") {
    const matchId = typeof payload.matchId === "string" ? payload.matchId : "";
    if (!matchId) throw new AppError(400, "MATCH_REQUIRED", "A match ID is required.");
    await getMatchForUser(matchId, state.userId);
    if (type === "subscribe") state.subscriptions.add(matchId);
    else state.subscriptions.delete(matchId);
    sendJson(state.socket, { type: type === "subscribe" ? "subscribed" : "unsubscribed", matchId });
    return;
  }

  if (type === "typing") {
    const matchId = typeof payload.matchId === "string" ? payload.matchId : "";
    if (!matchId) throw new AppError(400, "MATCH_REQUIRED", "A match ID is required.");
    await emitTyping(state.userId, matchId, payload.typing !== false);
    return;
  }

  if (type === "read") {
    const matchId = typeof payload.matchId === "string" ? payload.matchId : "";
    if (!matchId) throw new AppError(400, "MATCH_REQUIRED", "A match ID is required.");
    const result = await markRead(state.userId, matchId);
    sendJson(state.socket, { type: "read:ack", matchId, ...result });
    return;
  }

  if (type === "send") {
    const matchId = typeof payload.matchId === "string" ? payload.matchId : "";
    if (!matchId) throw new AppError(400, "MATCH_REQUIRED", "A match ID is required.");
    const messageType =
      payload.messageType === "image" || payload.messageType === "video"
        ? (payload.messageType as MessageType)
        : "text";
    await sendMessage(state.userId, matchId, {
      type: messageType,
      text: typeof payload.text === "string" ? payload.text : undefined,
      mediaId: typeof payload.mediaId === "string" ? payload.mediaId : undefined,
      clientId: typeof payload.clientId === "string" ? payload.clientId : undefined,
    });
    return;
  }

  if (type === "presence") {
    await touchUser(state.userId, payload.online !== false);
    sendJson(state.socket, { type: "presence:ack", online: payload.online !== false });
    return;
  }

  throw new AppError(400, "UNKNOWN_MESSAGE", `Unknown WebSocket message type: ${type || "(empty)"}`);
}

function onRealtimeEvent(event: RealtimeEvent) {
  if (event.type === "message") {
    for (const userId of event.participantIds) {
      const sockets = socketsByUser.get(userId);
      if (!sockets) continue;
      const message = event.message as { senderId?: string } & Record<string, unknown>;
      for (const socket of sockets) {
        sendJson(socket, {
          type: "message:new",
          matchId: event.matchId,
          message: { ...message, mine: message.senderId === userId },
        });
      }
    }
    return;
  }
  if (event.type === "read") {
    sendToUsers(event.participantIds, {
      type: "message:read",
      matchId: event.matchId,
      readerId: event.readerId,
      readAt: event.readAt,
    });
    return;
  }
  if (event.type === "typing") {
    for (const userId of event.participantIds) {
      if (userId === event.userId) continue;
      sendToUser(userId, {
        type: "typing",
        matchId: event.matchId,
        userId: event.userId,
        typing: event.typing,
      });
    }
    return;
  }
  if (event.type === "match") {
    sendToUsers(event.participantIds, { type: "match:new", matchId: event.matchId });
    return;
  }
  if (event.type === "match:removed") {
    sendToUsers(event.participantIds, { type: "match:removed", matchId: event.matchId });
  }
}

export function attachRealtimeServer(httpServer: HttpServer) {
  if (server) return server;
  server = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    maxPayload: 64 * 1024,
  });

  server.on("connection", (socket, request) => {
    void handleConnection(socket, request);
  });

  unsubscribeBus = realtimeBus.onEvent(onRealtimeEvent);

  heartbeat = setInterval(() => {
    if (!server) return;
    for (const socket of server.clients) {
      const state = stateBySocket.get(socket);
      if (!state) continue;
      if (!state.isAlive) {
        socket.terminate();
        continue;
      }
      state.isAlive = false;
      socket.ping();
    }
  }, 30_000);
  heartbeat.unref?.();

  server.on("listening", () => {
    logger.info("WebSocket server ready", { path: "/ws" });
  });

  return server;
}

export async function closeRealtimeServer() {
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
  unsubscribeBus?.();
  unsubscribeBus = null;
  if (!server) return;
  for (const socket of server.clients) socket.close(1001, "Server shutting down");
  await new Promise<void>((resolve) => {
    server?.close(() => resolve());
  });
  server = null;
  socketsByUser.clear();
}
