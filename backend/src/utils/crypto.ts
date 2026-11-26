import crypto from "node:crypto";
import { badRequest } from "./errors";

export function nowIso() {
  return new Date().toISOString();
}

export function addMinutesIso(minutes: number, from = new Date()) {
  return new Date(from.getTime() + minutes * 60_000).toISOString();
}

export function addHoursIso(hours: number, from = new Date()) {
  return new Date(from.getTime() + hours * 3_600_000).toISOString();
}

export function addDaysIso(days: number, from = new Date()) {
  return new Date(from.getTime() + days * 86_400_000).toISOString();
}

export function addMonthsIso(months: number, from = new Date()) {
  const date = new Date(from);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

export function randomId() {
  return crypto.randomUUID();
}

/** Opaque, URL-safe token raw material for email verification/reset links. */
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hmacSha256(value: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function timingSafeHex(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function safeEqualString(a: string, b: string) {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

export function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function signPayload(payload: unknown, secret: string) {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifySignedPayload<T>(token: string, secret: string): T {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw badRequest("INVALID_TOKEN", "Invalid signed token.");
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  if (!safeEqualString(signature, expected)) {
    throw badRequest("INVALID_TOKEN", "Invalid signed token.");
  }
  try {
    return JSON.parse(base64UrlDecode(encoded)) as T;
  } catch {
    throw badRequest("INVALID_TOKEN", "Invalid signed token.");
  }
}

export function parseIso(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isFuture(value: string | null | undefined) {
  const date = parseIso(value);
  return Boolean(date && date.getTime() > Date.now());
}
