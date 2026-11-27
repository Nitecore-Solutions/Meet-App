import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
const ACCESS_KEY = "@pagalpagal/access-token";
const REFRESH_KEY = "@pagalpagal/refresh-token";

/** True only when EXPO_PUBLIC_API_BASE_URL is set; otherwise the UI stays in mock mode. */
export const apiConfigured = BASE_URL.length > 0;

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
  refreshExpiresAt?: string;
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  if (!apiConfigured) throw new ApiError("API_NOT_CONFIGURED", "Backend URL is not configured.", 0);
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the server. Check your connection.", 0);
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  };
  if (!response.ok) {
    throw new ApiError(
      payload.error?.code ?? "API_ERROR",
      payload.error?.message ?? "Something went wrong. Please try again.",
      response.status
    );
  }
  return payload as T;
}

export async function saveTokens(tokens: SessionTokens) {
  await Promise.all([
    AsyncStorage.setItem(ACCESS_KEY, tokens.accessToken),
    AsyncStorage.setItem(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function clearTokens() {
  await Promise.all([AsyncStorage.removeItem(ACCESS_KEY), AsyncStorage.removeItem(REFRESH_KEY)]);
}
