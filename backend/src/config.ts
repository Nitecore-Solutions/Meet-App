import "dotenv/config";
import path from "node:path";

type EmailProviderName = "console" | "brevo";

function readBool(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function readNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readList(name: string, fallback: string[]) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const rootDir = path.resolve(__dirname, "..");
const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const port = readNumber("PORT", 4000);
const publicBaseUrl = (process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`).replace(/\/+$/, "");

const jwtSecret =
  process.env.JWT_SECRET ??
  "pagalpagal-development-secret-change-before-production";

const databaseUrl = process.env.DATABASE_URL ?? "";
// A locally installed PostgreSQL normally does not use SSL. Set DATABASE_SSL=true
// explicitly only if your server/proxy requires it.
const databaseSsl = readBool("DATABASE_SSL", false);

const brevoApiKey = process.env.BREVO_API_KEY ?? "";
const brevoFromEmail = process.env.BREVO_FROM_EMAIL ?? "";
const brevoConfigured = Boolean(brevoApiKey && brevoFromEmail);
const emailProvider = (process.env.EMAIL_PROVIDER ??
  (brevoConfigured ? "brevo" : "console")) as EmailProviderName;
if (emailProvider !== "console" && emailProvider !== "brevo") {
  throw new Error("EMAIL_PROVIDER must be 'console' or 'brevo'");
}
if (emailProvider === "brevo" && !brevoConfigured) {
  throw new Error("EMAIL_PROVIDER=brevo requires BREVO_API_KEY and BREVO_FROM_EMAIL");
}
const emailDevMode = readBool("EMAIL_DEV_MODE", !isProduction);

const razorpayKeyId = process.env.RAZORPAY_KEY_ID ?? "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
const razorpayConfigured = Boolean(razorpayKeyId && razorpayKeySecret);
const paymentsMock = readBool("PAYMENTS_MOCK", !razorpayConfigured);

if (isProduction) {
  if (jwtSecret.length < 32 || jwtSecret.startsWith("pagalpagal-development")) {
    throw new Error("Set a strong JWT_SECRET (32+ characters) in production");
  }
  if (emailProvider !== "brevo") {
    throw new Error("Use EMAIL_PROVIDER=brevo with Brevo credentials in production");
  }
  if (emailDevMode) {
    throw new Error("EMAIL_DEV_MODE cannot be enabled in production");
  }
  if (paymentsMock) {
    throw new Error("PAYMENTS_MOCK cannot be enabled in production");
  }
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in production. Use your PostgreSQL connection string.");
  }
}

export const config = {
  env: nodeEnv,
  isProduction,
  port,
  publicBaseUrl,
  corsOrigins: readList("CORS_ORIGINS", [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://localhost:3000",
  ]),
  database: {
    url: databaseUrl,
    ssl: databaseSsl,
    poolMax: readNumber("DATABASE_POOL_MAX", 10),
    pgliteDir: path.resolve(rootDir, process.env.PGLITE_DATA_DIR ?? "data/pglite"),
  },
  jwt: {
    secret: jwtSecret,
    issuer: "pagalpagal",
    audience: "pagalpagal-app",
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "1h",
    refreshTokenTtlDays: readNumber("REFRESH_TOKEN_TTL_DAYS", 30),
  },
  email: {
    provider: emailProvider,
    devMode: emailDevMode,
    // Frontend origin used to build verification and password-reset links.
    appUrl: (process.env.APP_URL ?? "http://localhost:8081").replace(/\/+$/, ""),
    verifyTtlMinutes: readNumber("EMAIL_VERIFY_TTL_MINUTES", 1440),
    resetTtlMinutes: readNumber("EMAIL_RESET_TTL_MINUTES", 60),
    resendSeconds: readNumber("EMAIL_RESEND_SECONDS", 60),
    maxTokensPerHour: readNumber("EMAIL_MAX_TOKENS_PER_HOUR", 5),
    brevo: {
      apiKey: brevoApiKey,
      fromEmail: brevoFromEmail,
      fromName: process.env.BREVO_FROM_NAME ?? "PagalPagal",
    },
  },
  // Media is always stored on this server's disk; there is no object-storage driver.
  storage: {
    localDir: path.resolve(rootDir, process.env.LOCAL_STORAGE_DIR ?? "data/uploads"),
    localSecret: process.env.LOCAL_STORAGE_SECRET ?? jwtSecret,
    uploadUrlTtlSeconds: readNumber("UPLOAD_URL_TTL_SECONDS", 900),
    downloadUrlTtlSeconds: readNumber("DOWNLOAD_URL_TTL_SECONDS", 3600),
  },
  media: {
    maxImageBytes: readNumber("MEDIA_MAX_IMAGE_MB", 10) * 1024 * 1024,
    maxVideoBytes: readNumber("MEDIA_MAX_VIDEO_MB", 60) * 1024 * 1024,
    maxVideoDurationSeconds: readNumber("VIDEO_MAX_DURATION_SECONDS", 60),
    videoRetentionHours: readNumber("VIDEO_RETENTION_HOURS", 8),
    pendingUploadTtlMinutes: readNumber("PENDING_UPLOAD_TTL_MINUTES", 60),
    galleryMaxPhotos: readNumber("GALLERY_MAX_PHOTOS", 6),
    ffprobePath: process.env.FFPROBE_PATH ?? "ffprobe",
    requireVideoProbe: readBool("REQUIRE_VIDEO_PROBE", isProduction),
    cleanupIntervalMs: readNumber("MEDIA_CLEANUP_INTERVAL_MS", 5 * 60 * 1000),
  },
  razorpay: {
    keyId: razorpayKeyId,
    keySecret: razorpayKeySecret,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
    mock: paymentsMock,
    planIds: {
      "1m": process.env.RAZORPAY_PLAN_ID_1M ?? "",
      "6m": process.env.RAZORPAY_PLAN_ID_6M ?? "",
      "12m": process.env.RAZORPAY_PLAN_ID_12M ?? "",
    },
  },
  logLevel: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
} as const;

export type Config = typeof config;
export type { EmailProviderName };
