import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { database, queryOne } from "./db";
import { storage } from "./services/storage";
import { AppError } from "./utils/errors";
import { logger } from "./utils/logger";
import { authRouter } from "./routes/auth";
import { billingRouter, razorpayWebhookHandler } from "./routes/billing";
import { chatRouter } from "./routes/chat";
import { devStorageDownload, devStorageUpload } from "./routes/dev-storage";
import { mediaRouter } from "./routes/media";
import { discoverRouter, likesRouter, usersRouter } from "./routes/users";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  // Requests arrive through Cloudflare's proxy; trust one hop so
  // express-rate-limit and logs use the visitor's real IP.
  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  const allowedOrigins = new Set(config.corsOrigins);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has("*") || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Content-Length", "Content-Type"],
    })
  );

  // These routes need the untouched request bytes, so they must be registered
  // before express.json().
  app.post(
    "/api/billing/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    razorpayWebhookHandler
  );
  app.put(
    "/api/dev/storage/upload",
    express.raw({ type: () => true, limit: config.media.maxVideoBytes + 1_048_576 }),
    devStorageUpload
  );
  app.get("/api/dev/storage/download", devStorageDownload);

  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => {
    res.json({
      name: "PagalPagal API",
      version: "1.0.0",
      docs: "/health",
      websocket: "/ws?token=<access-token>",
    });
  });

  // The emailed reset link lands here. Render a tiny form that completes the
  // reset against the API, so the link works even before a web app exists.
  app.get("/reset-password", (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset your PagalPagal password</title>
<style>body{font-family:Arial,sans-serif;background:#f4f6f8;color:#1a1a2e;margin:0;padding:40px 16px}
.card{max-width:420px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
input{width:100%;box-sizing:border-box;padding:12px;margin:10px 0 18px;border:1px solid #cbd5e0;border-radius:8px;font-size:15px}
button{width:100%;padding:14px;border:0;border-radius:8px;background:#f5c518;font-weight:bold;cursor:pointer}
#msg{margin-top:16px;font-size:14px}</style></head>
<body><div class="card">
<h2>Choose a new password</h2>
<p style="color:#4a5568;font-size:14px">Enter a new password for your PagalPagal account.</p>
<form id="f"><input type="password" id="pw" minlength="8" placeholder="New password (8+ characters)" required>
<button type="submit">Reset password</button></form>
<p id="msg"></p></div>
<script>
document.getElementById('f').addEventListener('submit', async function(e){
  e.preventDefault();
  var msg=document.getElementById('msg');
  try{
    var r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:${JSON.stringify(token)},password:document.getElementById('pw').value})});
    var d=await r.json();
    msg.textContent = r.ok ? 'Password updated. You can now sign in.' : (d.error&&d.error.message)||'Could not reset the password.';
    msg.style.color = r.ok ? '#0e7a4e' : '#c53030';
    if(r.ok) document.getElementById('f').reset();
  }catch(err){msg.textContent='Could not reach the server.';}
});
</script></body></html>`);
  });

  app.get("/health", async (_req, res) => {
    const startedAt = Date.now();
    await queryOne("SELECT 1 AS ok");
    res.json({
      ok: true,
      database: database.driver(),
      databaseLatencyMs: Date.now() - startedAt,
      storage: storage.driver,
      emailProvider: config.email.provider,
      emailDevMode: config.email.devMode,
      paymentsMock: config.razorpay.mock,
      environment: config.env,
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests. Try again shortly." } },
  });
  app.use("/api", apiLimiter);

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/discover", discoverRouter);
  app.use("/api/likes", likesRouter);
  app.use("/api/media", mediaRouter);
  app.use("/api/chats", chatRouter);
  app.use("/api/billing", billingRouter);

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "The requested endpoint does not exist." },
    });
  });

  const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
    if (res.headersSent) return;
    if (error instanceof AppError) {
      res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
      return;
    }

    const record = error as {
      type?: string;
      status?: number;
      statusCode?: number;
      message?: string;
      stack?: string;
    };
    if (record.type === "entity.too.large") {
      res.status(413).json({
        error: { code: "PAYLOAD_TOO_LARGE", message: "The request body is too large." },
      });
      return;
    }
    if (record instanceof SyntaxError || record.type === "entity.parse.failed") {
      res.status(400).json({
        error: { code: "INVALID_JSON", message: "The request body is not valid JSON." },
      });
      return;
    }

    logger.error("Unhandled request error", {
      method: req.method,
      path: req.path,
      message: record.message,
      stack: config.isProduction ? undefined : record.stack,
    });
    res.status(record.status ?? record.statusCode ?? 500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: config.isProduction
          ? "Something went wrong. Please try again."
          : record.message ?? "Something went wrong.",
      },
    });
  };
  app.use(errorHandler);

  return app;
}
