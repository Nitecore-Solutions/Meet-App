import http from "node:http";
import { config } from "./config";
import { closeDatabase, initializeDatabase, query } from "./db";
import { createApp } from "./app";
import { attachRealtimeServer, closeRealtimeServer } from "./realtime/hub";
import { cleanupExpiredMedia } from "./services/media";
import { addDaysIso, nowIso } from "./utils/crypto";
import { logger } from "./utils/logger";

let mediaCleanupTimer: NodeJS.Timeout | null = null;
let authCleanupTimer: NodeJS.Timeout | null = null;
let shuttingDown = false;

async function cleanupAuthArtifacts() {
  const timestamp = nowIso();
  const oldRefresh = addDaysIso(-30);
  const [authTokens, refreshTokens] = await Promise.all([
    query(
      "DELETE FROM auth_tokens WHERE expires_at < $1 OR (consumed_at IS NOT NULL AND consumed_at < $2)",
      [timestamp, addDaysIso(-7)]
    ),
    query(
      `DELETE FROM refresh_tokens
       WHERE expires_at < $1 OR (revoked_at IS NOT NULL AND revoked_at < $2)`,
      [timestamp, oldRefresh]
    ),
  ]);
  if (authTokens.rowCount > 0 || refreshTokens.rowCount > 0) {
    logger.debug("Auth cleanup complete", {
      authTokens: authTokens.rowCount,
      refreshTokens: refreshTokens.rowCount,
    });
  }
}

async function runMediaCleanup() {
  try {
    await cleanupExpiredMedia();
  } catch (error) {
    logger.error("Media cleanup failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function bootstrap() {
  await initializeDatabase();

  const app = createApp();
  const server = http.createServer(app);
  attachRealtimeServer(server);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, "0.0.0.0", () => {
      server.off("error", reject);
      resolve();
    });
  });

  await runMediaCleanup();
  mediaCleanupTimer = setInterval(() => {
    void runMediaCleanup();
  }, config.media.cleanupIntervalMs);
  mediaCleanupTimer.unref?.();

  void cleanupAuthArtifacts().catch(() => {});
  authCleanupTimer = setInterval(() => {
    void cleanupAuthArtifacts().catch((error) => {
      logger.error("Auth cleanup failed", {
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }, 60 * 60 * 1000);
  authCleanupTimer.unref?.();

  logger.info("PagalPagal backend started", {
    environment: config.env,
    port: config.port,
    publicBaseUrl: config.publicBaseUrl,
    storage: "local",
    emailProvider: config.email.provider,
    paymentsMock: config.razorpay.mock,
    websocket: `${config.publicBaseUrl.replace(/^http/, "ws")}/ws`,
  });

  const shutdown = async (signal: string, code = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info("Shutting down", { signal });
    if (mediaCleanupTimer) clearInterval(mediaCleanupTimer);
    if (authCleanupTimer) clearInterval(authCleanupTimer);
    mediaCleanupTimer = null;
    authCleanupTimer = null;
    try {
      await closeRealtimeServer();
    } catch (error) {
      logger.warn("Could not close WebSocket server cleanly", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections?.();
    });
    await closeDatabase().catch((error) => {
      logger.warn("Could not close database cleanly", {
        message: error instanceof Error ? error.message : String(error),
      });
    });
    process.exit(code);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("uncaughtException", (error) => {
    logger.error("Uncaught exception", { message: error.message, stack: error.stack });
    void shutdown("uncaughtException", 1);
  });
  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled rejection", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}

bootstrap().catch(async (error) => {
  logger.error("Backend failed to start", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  await closeDatabase().catch(() => {});
  process.exit(1);
});
