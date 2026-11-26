import type { z } from "zod";
import { badRequest } from "./errors";

export function parseBody<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw badRequest(
      "VALIDATION_ERROR",
      first?.message ?? "Check the request and try again.",
      result.error.flatten()
    );
  }
  return result.data;
}

export function parseQuery<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw badRequest(
      "VALIDATION_ERROR",
      first?.message ?? "Check the query and try again.",
      result.error.flatten()
    );
  }
  return result.data;
}
