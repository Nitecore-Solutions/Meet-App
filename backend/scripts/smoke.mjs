#!/usr/bin/env node
/**
 * PagalPagal backend integration smoke test.
 *
 * Run: npm run smoke
 *
 * Starts a throwaway backend on port 4100 with a fresh database and local media
 * storage, exercises the email/password auth, chat, media and billing flows,
 * then shuts it down. Set BASE_URL to test an already-running server instead.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_DIR = path.resolve(HERE, "..");
const BASE_URL = (process.env.BASE_URL ?? "").replace(/\/+$/, "");
const PORT = Number(process.env.SMOKE_PORT ?? 4100);
const baseUrl = BASE_URL || `http://127.0.0.1:${PORT}`;
const wsUrl = baseUrl.replace(/^http/, "ws") + "/ws";
const PASSWORD = "SmokeTest@123";

let child = null;
let tempRoot = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(method, pathname, { token, body, headers, raw } = {}) {
  const init = { method, headers: { ...(headers ?? {}) } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    if (raw) init.body = body;
    else {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
  }
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return { status: response.status, body: payload, headers: response.headers };
}

function ok(result, label) {
  assert.ok(
    result.status >= 200 && result.status < 300,
    `${label} failed: HTTP ${result.status} ${JSON.stringify(result.body)}`
  );
  return result.body;
}

async function waitForHealth(timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const result = await request("GET", "/health");
      if (result.status === 200) return ok(result, "health");
      lastError = new Error(`HTTP ${result.status}: ${JSON.stringify(result.body)}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(300);
  }
  throw new Error(`Backend did not become healthy: ${lastError?.message ?? "unknown error"}`);
}

async function startServer() {
  if (BASE_URL) {
    await waitForHealth();
    return;
  }
  tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "pagalpagal-smoke-"));
  const env = {
    ...process.env,
    PORT: String(PORT),
    PUBLIC_BASE_URL: baseUrl,
    APP_URL: baseUrl,
    NODE_ENV: "development",
    DATABASE_URL: "",
    PGLITE_DATA_DIR: path.join(tempRoot, "pglite"),
    LOCAL_STORAGE_DIR: path.join(tempRoot, "uploads"),
    EMAIL_PROVIDER: "console",
    EMAIL_DEV_MODE: "true",
    EMAIL_RESEND_SECONDS: "0",
    PAYMENTS_MOCK: "true",
    LOG_LEVEL: "warn",
  };
  child = spawn(process.execPath, [path.join(BACKEND_DIR, "dist", "index.js")], {
    cwd: BACKEND_DIR,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (chunk) => (log += chunk.toString()));
  child.stderr.on("data", (chunk) => (log += chunk.toString()));
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`[backend exited ${code}]\n${log}`);
  });
  await waitForHealth();
}

async function stopServer() {
  if (child && !child.killed) {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      sleep(3000).then(() => child.kill("SIGKILL")),
    ]);
  }
  if (tempRoot) await fs.promises.rm(tempRoot, { recursive: true, force: true }).catch(() => {});
}

function wsSend(socket, payload) {
  socket.send(JSON.stringify(payload));
}

function wsNext(socket, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for WebSocket message"));
    }, timeoutMs);
    const onMessage = (data) => {
      cleanup();
      resolve(JSON.parse(data.toString()));
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    function cleanup() {
      clearTimeout(timer);
      socket.off("message", onMessage);
      socket.off("error", onError);
    }
    socket.once("message", onMessage);
    socket.once("error", onError);
  });
}

async function testWebsocket(token, matchId) {
  const socket = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });
  try {
    const ready = await wsNext(socket);
    assert.equal(ready.type, "ready", `Expected ready, got ${JSON.stringify(ready)}`);

    wsSend(socket, { type: "subscribe", matchId });
    const subscribed = await wsNext(socket);
    assert.equal(subscribed.type, "subscribed", JSON.stringify(subscribed));

    const incoming = wsNext(socket);
    wsSend(socket, {
      type: "send",
      matchId,
      text: "WebSocket smoke message",
      clientId: `ws-${Date.now()}`,
    });
    const messageEvent = await incoming;
    assert.equal(messageEvent.type, "message:new", JSON.stringify(messageEvent));
    assert.equal(messageEvent.message.text, "WebSocket smoke message");

    wsSend(socket, { type: "ping" });
    assert.equal((await wsNext(socket)).type, "pong");
  } finally {
    socket.close();
  }
}

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const png = Buffer.from(PNG_BASE64, "base64");
const mp4 = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
  0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x6d, 0x70, 0x34, 0x31,
]);

async function registerUser(name) {
  const email = `${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@smoke.test`;
  const registered = ok(
    await request("POST", "/api/auth/register", {
      body: { email, password: PASSWORD, name },
    }),
    "register"
  );
  assert.equal(registered.verificationRequired, true);
  assert.match(registered.devToken ?? "", /.{20,}/, "Dev verification token should be exposed");
  const verified = ok(
    await request("POST", "/api/auth/verify-email", { body: { token: registered.devToken } }),
    "verify-email"
  );
  assert.equal(verified.user.emailVerified, true);
  assert.ok(verified.tokens.accessToken);
  return { email, userId: registered.user.id, token: verified.tokens.accessToken, refreshToken: verified.tokens.refreshToken };
}

async function uploadAndComplete(token, file) {
  const created = ok(
    await request("POST", "/api/media/uploads", {
      token,
      body: {
        files: [
          {
            purpose: file.purpose,
            mimeType: file.mimeType,
            sizeBytes: file.bytes.length,
            ...(file.durationSeconds ? { durationSeconds: file.durationSeconds } : {}),
          },
        ],
      },
    }),
    "media uploads"
  );
  const { media, upload } = created.uploads[0];
  const putResult = await fetch(upload.url, {
    method: "PUT",
    headers: { "Content-Type": file.mimeType },
    body: file.bytes,
  });
  assert.ok(putResult.ok, `Local upload failed: HTTP ${putResult.status}`);
  const completed = ok(
    await request("POST", `/api/media/${media.id}/complete`, { token }),
    "media complete"
  );
  return completed.media;
}

async function testVideoExpiryCleanup() {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "pagalpagal-expiry-"));
  process.env.DATABASE_URL = "";
  process.env.PGLITE_DATA_DIR = path.join(dir, "pglite");
  process.env.LOCAL_STORAGE_DIR = path.join(dir, "uploads");
  process.env.LOG_LEVEL = "error";

  const dbModule = await import(new URL("../dist/db.js", import.meta.url).href);
  const mediaModule = await import(new URL("../dist/services/media.js", import.meta.url).href);
  const storageModule = await import(new URL("../dist/services/storage.js", import.meta.url).href);
  const cryptoModule = await import(new URL("../dist/utils/crypto.js", import.meta.url).href);
  const passwordModule = await import(new URL("../dist/utils/password.js", import.meta.url).href);

  try {
    await dbModule.initializeDatabase();
    const userId = `expiry-${Date.now()}`;
    const mediaId = cryptoModule.randomId();
    const storageKey = `chat/${userId}/${mediaId}.mp4`;
    const now = cryptoModule.nowIso();
    await dbModule.query(
      `INSERT INTO users (id, email, password_hash, email_verified, name, created_at, updated_at)
       VALUES ($1, $2, $3, TRUE, 'Expiry Test', $4, $4)`,
      [userId, `expiry-${mediaId}@smoke.test`, await passwordModule.hashPassword(PASSWORD), now]
    );
    await dbModule.query(
      `INSERT INTO media
        (id, owner_id, purpose, kind, storage_driver, storage_key, mime_type, size_bytes,
         status, created_at, completed_at, expires_at)
       VALUES ($1, $2, 'chat', 'video', 'local', $3, 'video/mp4', 24,
               'ready', $4, $4, $5)`,
      [mediaId, userId, storageKey, now, cryptoModule.addHoursIso(-1)]
    );
    const filePath = storageModule.localFilePath(storageKey);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, mp4);

    const result = await mediaModule.cleanupExpiredMedia();
    assert.ok(result.deleted >= 1, "Cleanup should delete the expired video");
    const row = await dbModule.queryOne("SELECT status, storage_key FROM media WHERE id = $1", [mediaId]);
    assert.equal(row.status, "deleted");
    assert.equal(row.storage_key, null);
    assert.equal(fs.existsSync(filePath), false);
  } finally {
    await dbModule.closeDatabase();
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

async function run() {
  await startServer();
  console.log(`→ Smoke testing ${baseUrl}`);

  const health = await waitForHealth();
  assert.equal(health.ok, true);
  console.log(`  health: database=${health.database} storage=${health.storage} email=${health.emailProvider} paymentsMock=${health.paymentsMock}`);

  // Email/password authentication: register -> verify -> login.
  const alice = await registerUser("Alice");
  const bob = await registerUser("Bob");
  await registerUser("Carol");
  let token = alice.token;
  let refreshToken = alice.refreshToken;

  const loginResult = ok(
    await request("POST", "/api/auth/login", { body: { email: alice.email, password: PASSWORD } }),
    "login"
  );
  assert.equal(loginResult.user.emailVerified, true);
  assert.ok(loginResult.tokens.accessToken);

  const unverifiedEmail = `pending-${Date.now()}@smoke.test`;
  const pending = ok(
    await request("POST", "/api/auth/register", { body: { email: unverifiedEmail, password: PASSWORD } }),
    "register pending"
  );
  const blockedLogin = await request("POST", "/api/auth/login", {
    body: { email: unverifiedEmail, password: PASSWORD },
  });
  assert.equal(blockedLogin.status, 403, "Unverified accounts must not be able to sign in");
  assert.equal(blockedLogin.body.error.code, "EMAIL_NOT_VERIFIED");
  const resent = ok(
    await request("POST", "/api/auth/resend-verification", { body: { email: unverifiedEmail } }),
    "resend verification"
  );
  assert.match(resent.devToken ?? "", /.{20,}/);
  await request("POST", "/api/auth/verify-email", { body: { token: pending.devToken } });
  console.log("  auth: register, email verification, sign-in gating, resend + login OK");

  // Profile read/update and discovery with real accounts (no demo data).
  const me = ok(await request("GET", "/api/users/me", { token }), "get me");
  assert.equal(me.user.email, alice.email);
  ok(
    await request("PATCH", "/api/users/me", { token, body: { bio: "Smoke test bio", interests: ["Music"] } }),
    "update me"
  );
  const discovery = ok(await request("GET", "/api/discover", { token }), "discover");
  assert.ok(discovery.profiles.length >= 2, "Other registered users should be discoverable");
  console.log(`  users: profile update OK, ${discovery.profiles.length} discoverable profiles`);

  // Mutual like creates a match; REST chat send + history + mark-read.
  const likeResult = ok(await request("POST", `/api/users/${bob.userId}/like`, { token }), "like Bob");
  assert.equal(likeResult.liked, true);
  const reciprocal = ok(
    await request("POST", `/api/users/${alice.userId}/like`, { token: bob.token }),
    "Bob likes back"
  );
  assert.equal(reciprocal.matched, true, "Reciprocal likes should create a match");
  const chats = ok(await request("GET", "/api/chats", { token }), "list chats");
  assert.ok(chats.conversations.length > 0);
  const matchId = chats.conversations[0].id;
  const sent = ok(
    await request("POST", `/api/chats/${matchId}/messages`, {
      token,
      body: { type: "text", text: "Hello from smoke test", clientId: `rest-${Date.now()}` },
    }),
    "send message"
  );
  const messages = ok(await request("GET", `/api/chats/${matchId}/messages`, { token }), "list messages");
  assert.ok(messages.messages.some((message) => message.id === sent.message.id));
  ok(await request("POST", `/api/chats/${matchId}/read`, { token: bob.token }), "mark read");
  console.log(`  chat: mutual match, REST send + history + read OK (${messages.messages.length} messages)`);

  await testWebsocket(alice.token, matchId);
  console.log("  websocket: ready, subscribe, send, message:new, ping OK");

  // Image lifecycle + avatar + gallery.
  const avatar = await uploadAndComplete(token, { purpose: "avatar", mimeType: "image/png", bytes: png });
  assert.equal(avatar.status, "ready");
  assert.ok(avatar.url);
  const fetched = await fetch(avatar.url);
  assert.equal(fetched.status, 200);
  assert.equal(Number(fetched.headers.get("content-length")), png.length);
  ok(await request("PUT", "/api/users/me/avatar", { token, body: { mediaId: avatar.id } }), "set avatar");
  const gallery = await uploadAndComplete(token, { purpose: "gallery", mimeType: "image/png", bytes: png });
  const attached = ok(
    await request("POST", "/api/users/me/photos", { token, body: { mediaIds: [gallery.id] } }),
    "attach photo"
  );
  assert.equal(attached.photos.length, 1);
  const reordered = ok(
    await request("PATCH", "/api/users/me/photos/order", { token, body: { mediaIds: [gallery.id] } }),
    "reorder photos"
  );
  ok(
    await request("DELETE", `/api/users/me/photos/${reordered.photos[0].photoId}`, { token }),
    "delete photo"
  );
  console.log("  media: upload, local download URL, avatar, gallery + reorder + delete OK");

  // Video: 60s limit metadata, 8h expiry, chat send, and cleanup deletion.
  const video = await uploadAndComplete(token, {
    purpose: "chat",
    mimeType: "video/mp4",
    bytes: mp4,
    durationSeconds: 20,
  });
  assert.equal(video.durationSeconds, 20);
  const retentionHours = (new Date(video.expiresAt).getTime() - Date.now()) / 3_600_000;
  assert.ok(retentionHours > 7.5 && retentionHours <= 8.1);
  assert.equal(
    (await request("POST", `/api/chats/${matchId}/messages`, {
      token,
      body: { type: "video", mediaId: video.id },
    })).status,
    201
  );
  await testVideoExpiryCleanup();
  console.log(`  video: ${retentionHours.toFixed(1)}h expiry, chat send + cleanup deletion OK`);

  // Forgot/reset password.
  const forgot = ok(
    await request("POST", "/api/auth/forgot-password", { body: { email: alice.email } }),
    "forgot password"
  );
  assert.match(forgot.devToken ?? "", /.{20,}/);
  ok(
    await request("POST", "/api/auth/reset-password", {
      body: { token: forgot.devToken, password: "NewSmoke@456" },
    }),
    "reset password"
  );
  const afterReset = ok(
    await request("POST", "/api/auth/login", {
      body: { email: alice.email, password: "NewSmoke@456" },
    }),
    "login with new password"
  );
  // Password reset deliberately revokes all existing sessions.
  token = afterReset.tokens.accessToken;
  refreshToken = afterReset.tokens.refreshToken;
  const oldPasswordLogin = await request("POST", "/api/auth/login", {
    body: { email: alice.email, password: PASSWORD },
  });
  assert.equal(oldPasswordLogin.status, 401, "Old password must stop working");
  console.log("  password: forgot + reset + new-password login + old-password rejection OK");

  // Mock Razorpay flow.
  const plans = ok(await request("GET", "/api/billing/plans"), "plans");
  assert.equal(plans.plans.length, 3);
  const before = ok(await request("GET", "/api/billing/status", { token }), "billing before");
  assert.equal(before.isPlus, false);
  const checkout = ok(
    await request("POST", "/api/billing/checkout", { token, body: { planId: "1m" } }),
    "checkout"
  );
  assert.equal(checkout.mode, "mock");
  const completed = ok(
    await request("POST", "/api/billing/mock/complete", { token, body: { checkoutId: checkout.checkoutId } }),
    "mock complete"
  );
  assert.equal(completed.user.isPlus, true);
  console.log("  billing: mock checkout + Plus activation OK");

  // Refresh rotation and logout.
  const refreshed = ok(
    await request("POST", "/api/auth/refresh", { body: { refreshToken } }),
    "refresh"
  );
  token = refreshed.tokens.accessToken;
  refreshToken = refreshed.tokens.refreshToken;
  ok(await request("GET", "/api/users/me", { token }), "me with refreshed token");
  ok(await request("POST", "/api/auth/logout", { token, body: { refreshToken } }), "logout");
  console.log("  tokens: refresh rotation + logout OK");

  console.log("\n✅ Backend smoke test passed");
}

run()
  .catch((error) => {
    console.error("\n❌ Backend smoke test failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => stopServer());
