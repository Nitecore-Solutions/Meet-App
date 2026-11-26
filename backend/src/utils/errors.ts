export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(code: string, message: string, details?: unknown) {
  return new AppError(400, code, message, details);
}

export function unauthorized(code = "AUTH_REQUIRED", message = "Authentication is required.") {
  return new AppError(401, code, message);
}

export function forbidden(code = "FORBIDDEN", message = "You do not have access to this resource.") {
  return new AppError(403, code, message);
}

export function notFound(code = "NOT_FOUND", message = "The requested resource was not found.") {
  return new AppError(404, code, message);
}

export function conflict(code: string, message: string, details?: unknown) {
  return new AppError(409, code, message, details);
}

export function tooMany(code = "RATE_LIMITED", message = "Too many requests. Please try again later.") {
  return new AppError(429, code, message);
}

export function gone(code: string, message: string) {
  return new AppError(410, code, message);
}

export function unprocessable(code: string, message: string, details?: unknown) {
  return new AppError(422, code, message, details);
}
