import { badRequest } from "./errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(input: string): string {
  const value = input.trim().toLowerCase();
  if (value.length > 254 || !EMAIL_PATTERN.test(value)) {
    throw badRequest("INVALID_EMAIL", "Enter a valid email address.");
  }
  return value;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
