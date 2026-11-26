# PagalPagal backend

Standalone TypeScript backend for PagalPagal: **email/password authentication
with Brevo verification**, profiles and discovery, likes/matches, real-time chat
over WebSockets, media uploads stored on **this server's disk**, and Razorpay
Plus subscriptions (with a mock mode for development).

There is no external database or object-storage service. In production the
backend uses **PostgreSQL installed on the same VPS**, and all images/videos are
written to `LOCAL_STORAGE_DIR`. No demo/dummy accounts or messages are seeded.

## Quick start (local development)

```bash
cd backend
npm install
cp .env.example .env   # optional: dev defaults work without a .env
npm run dev            # http://localhost:4000, ws://localhost:4000/ws
```

With no `.env` the dev server uses an embedded PGlite database (a dev-only
dependency, never used in production), local media files, a console email
provider that returns verification/reset links as `devToken`/`devLink`, and mock
payments. Check `GET /health` and run `npm run smoke` for a full integration test.

## Server deployment (single VPS)

The repo includes helper scripts:

| Script | Purpose |
| --- | --- |
| `scripts/setup-postgres.sh` | Install PostgreSQL, create the `pagalpagal` role and database, apply the schema |
| `scripts/deploy.sh` | Install deps, build, and start/restart the API with PM2 |

On Ubuntu/Debian as root or a sudo user:

```bash
git clone <your-repo> /var/www/pagalpagal
cd /var/www/pagalpagal/backend
cp .env.example .env        # then edit it
sudo bash scripts/setup-postgres.sh
bash scripts/deploy.sh
```

`setup-postgres.sh` reads `DATABASE_URL` from `.env` (or accepts `DB_PASSWORD`
as an override), creates the role/database if missing, builds the project, and
pipes `src/db/schema.ts` into `psql`. The schema is also applied idempotently on
every backend start, so this step is safe to repeat.

### Example ` DATABASE_URL`

```env
DATABASE_URL=postgresql://pagalpagal:a-strong-password@127.0.0.1:5432/pagalpagal
DATABASE_SSL=false
```

Database pool size is `DATABASE_POOL_MAX` (default 10). The schema covers
`users`, `auth_tokens`, `refresh_tokens`, `media`, `user_photos`, `likes`,
`passes`, `blocks`, `matches`, `messages`, `read_states`, `billing_checkouts`,
`subscriptions` and `webhook_events`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start with `tsx watch` (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | Type-check without emitting |
| `npm run smoke` | End-to-end integration test (spawns its own dev server) |
| `npm run db:setup` | Install/configure local PostgreSQL |
| `npm run deploy` | Build and start with PM2 |

## Authentication flow (email/password + Brevo)

1. **Register** — `POST /api/auth/register` with `{ email, password, name? }`.
   Creates an unverified account, hashes the password with scrypt
   (`scrypt$<salt>$<hash>`), and emails a single-use verification link through
   Brevo. Password must be 8–128 characters.
2. **Verify email** — the link points to `${APP_URL}/verify-email?token=...`;
   the app calls `POST /api/auth/verify-email` with the token. Verification
   marks `email_verified = true` and returns access + refresh tokens.
3. **Sign in** — `POST /api/auth/login` with `{ email, password }`. Unverified
   accounts are rejected with `EMAIL_NOT_VERIFIED` and can request a new link.
4. **Resend verification** — `POST /api/auth/resend-verification`.
5. **Forgot password** — `POST /api/auth/forgot-password` always returns
   `{ ok: true }` so accounts cannot be enumerated.
6. **Reset password** — `POST /api/auth/reset-password` with the emailed token
   and a new password. The token is one-time, expires (default 60 minutes), and
   **all existing refresh sessions are revoked**.
7. **Session** — access tokens are JWTs (1h); refresh tokens are SHA-256 hashed
   in the DB, rotate on use, and can be revoked on logout.

Tokens are random 32-byte values stored only as SHA-256 hashes in `auth_tokens`.
Issue limits (`EMAIL_MAX_TOKENS_PER_HOUR`) and a resend cooldown
(`EMAIL_RESEND_SECONDS`) apply. `GET /health` reports `emailProvider`.

### Brevo

```env
EMAIL_PROVIDER=brevo
EMAIL_DEV_MODE=false
BREVO_API_KEY=your-key
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=PagalPagal
```

The provider calls Brevo's `POST /v3/smtp/email`. The verification/reset links
are built from `APP_URL`. If delivery fails, the issued token is deleted and the
request fails. To add another provider, implement `EmailProvider` in
`src/services/email-providers.ts` and extend `getEmailProvider()`.

## HTTP API

All endpoints are under `/api`, return JSON, and authenticated routes expect
`Authorization: Bearer <accessToken>`. Errors are
`{ "error": { "code", "message", "details?" } }`.

### Auth — `/api/auth`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/register` | `{ email, password, name? }` → unverified user + `verificationRequired` |
| POST / GET | `/verify-email` | `{ token }` / `?token=` → user + tokens |
| POST | `/resend-verification` | `{ email }` |
| POST | `/login` | `{ email, password }` → user + tokens |
| POST | `/forgot-password` | `{ email }` → `{ ok: true }` |
| POST | `/reset-password` | `{ token, password }` → `{ ok: true }` |
| POST | `/refresh` | `{ refreshToken }` → rotated tokens |
| POST | `/logout` | `{ refreshToken }` |
| GET | `/session` | Current user |

In dev, `register`, `resend-verification` and `forgot-password` also return
`devToken` and `devLink` so flows can be tested without an inbox.

### Profiles and social — `/api/users`, `/api/discover`, `/api/likes`

| Method | Path | Purpose |
| --- | --- | --- |
| GET/PATCH | `/api/users/me` | Read/update own profile (email cannot be changed here) |
| GET/POST | `/api/users/me/photos` | List/attach gallery photos |
| PATCH | `/api/users/me/photos/order` | Reorder gallery (photo IDs stay stable) |
| DELETE | `/api/users/me/photos/:photoId` | Remove a photo |
| PUT | `/api/users/me/avatar` | Set avatar from a ready `avatar` upload |
| GET | `/api/users/:id` (+ `/state`) | Public profile and social state |
| POST | `/api/users/:id/like` / `/pass` / `/block` | Social actions; reciprocal likes create a match |
| DELETE | `/api/users/:id/block` | Unblock |
| GET | `/api/discover` | Paginated discovery with filters |
| GET | `/api/likes` | Incoming likes |

### Media — `/api/media`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/uploads` | `{ files: [{ purpose, mimeType, sizeBytes, durationSeconds? }] }` → signed upload targets |
| POST | `/:id/complete` | Finalize an upload |
| GET | `/:id` | Serialized media with a download URL |

Files are stored under `LOCAL_STORAGE_DIR` and served through signed URLs at
`/api/dev/storage/upload` and `/api/dev/storage/download` (these paths work in
production too — the name is historical). Lifecycle: `pending` → `ready` →
`deleted`. Images: JPG/PNG/WebP/GIF up to `MEDIA_MAX_IMAGE_MB` (10). Videos:
MP4/MOV/WebM up to `MEDIA_MAX_VIDEO_MB` (60) and
`VIDEO_MAX_DURATION_SECONDS` (60). **Videos expire after
`VIDEO_RETENTION_HOURS` (8)** and are deleted by the cleanup job; expired
videos cannot be sent as chat messages. Install ffmpeg and set
`REQUIRE_VIDEO_PROBE=true` for strict server-side duration verification.

### Chat — `/api/chats`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Conversations and total unread count |
| GET | `/with/:userId` | Conversation with a matched user |
| GET/POST | `/:matchId/messages` | History (`before`, `limit`) / send text/image/video |
| POST | `/:matchId/read` | Mark as read |
| POST | `/:matchId/typing` | Emit typing event |
| DELETE | `/:matchId` | Unmatch |

### Billing — `/api/billing`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/plans` | Public plan catalogue |
| GET | `/status` | Plus status (auth) |
| POST | `/checkout` | `{ planId, recurring? }` (auth) |
| POST | `/verify` | Razorpay signature verification (auth) |
| POST | `/mock/complete` | Mock activation (dev only) |
| POST | `/cancel` | Cancel recurring Plus (auth) |
| POST | `/webhook` | Razorpay webhook (raw body, HMAC verified) |

## WebSocket protocol

Connect to `/ws?token=<accessToken>` (or `Authorization: Bearer`). Client
messages: `ping`, `subscribe`/`unsubscribe` (`matchId`), `send` (`matchId`,
`text?`, `mediaId?`, `clientId?`, `messageType?`), `typing`, `read`, `presence`.
Server events: `ready`, `pong`, `subscribed`, `unsubscribed`, `message:new`,
`message:read`, `typing`, `match:new`, `match:removed`, `presence:ack`, `error`.
Connections are authenticated, rate-limited, heartbeated, and presence is
persisted.

## Project layout

```
backend/
├─ src/
│  ├─ app.ts, index.ts        Express app, bootstrap, cleanup jobs
│  ├─ config.ts               Environment parsing (local Postgres, Brevo, local media)
│  ├─ db.ts, db/schema.ts     PostgreSQL pool, PGlite dev fallback, schema
│  ├─ domain/types.ts         Row/domain types
│  ├─ middleware/auth.ts      Bearer-token middleware
│  ├─ realtime/               WebSocket hub + event bus
│  ├─ routes/                 auth, users, media, chat, billing, dev storage
│  ├─ services/               email-auth, email-providers, tokens, users,
│  │                          social, chat, media, video, storage, billing
│  └─ utils/                  logger, errors, crypto, password, email, validation
├─ scripts/
│  ├─ setup-postgres.sh       Install/configure local PostgreSQL
│  ├─ deploy.sh               Build + PM2 start
│  ├─ export-schema.mjs       Print SCHEMA_SQL for manual psql use
│  └─ smoke.mjs               End-to-end integration test
├─ ecosystem.config.cjs       PM2 process definition
├─ .env.example
└─ README.md
```

## Mobile integration

The Expo app in `../mobile` is still mock-data driven. Replace simulated auth
with `/api/auth/register`, `/verify-email`, `/login` and `/reset-password`,
persist the returned tokens, attach the bearer token to requests and `/ws`, and
rotate on 401. Connect chat to `/api/chats` plus WebSocket events, and upload
media through `/api/media/uploads` → signed `PUT` → `/api/media/:id/complete`.

## Deployment notes

- `NODE_ENV=production` requires a strong `JWT_SECRET`, `EMAIL_PROVIDER=brevo`
  with an API key, `PAYMENTS_MOCK=false`, and `DATABASE_URL`.
- Set `PUBLIC_BASE_URL` and `APP_URL` to your real HTTPS origins and add matching
  `CORS_ORIGINS`. Use Let's Encrypt for TLS and forward WebSocket `Upgrade`
  headers in Nginx. Never expose port 4000 directly.
- Install ffmpeg if `REQUIRE_VIDEO_PROBE=true`; otherwise video uploads fail.
- Back up the database (`pg_dump`) and `LOCAL_STORAGE_DIR` on a schedule.
- The WebSocket hub is in-process: run one Node instance. For multiple
  instances, replace `realtime/events.ts` with Redis pub/sub.
