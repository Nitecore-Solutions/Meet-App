import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { config } from "../config";
import { AppError, badRequest, notFound } from "../utils/errors";
import { signPayload, verifySignedPayload } from "../utils/crypto";

export type UploadTarget = {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresInSeconds: number;
};

export type StoredObject = {
  size: number;
  contentType: string | null;
};

export interface StorageProvider {
  readonly driver: "local";
  createUploadUrl(key: string, mimeType: string): Promise<UploadTarget>;
  stat(key: string): Promise<StoredObject | null>;
  readHead(key: string, bytes: number): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getDownloadUrl(key: string, mimeType: string): Promise<string>;
  downloadToFile(key: string, destination: string): Promise<void>;
}

function localPathForKey(key: string) {
  const root = path.resolve(config.storage.localDir);
  const resolved = path.resolve(root, key);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new AppError(400, "INVALID_STORAGE_KEY", "Invalid storage key.");
  }
  return resolved;
}

type LocalTokenPayload = {
  key: string;
  mime?: string;
  exp: number;
  kind: "upload" | "download";
};

export function verifyLocalStorageToken(token: string, kind: "upload" | "download") {
  const payload = verifySignedPayload<LocalTokenPayload>(token, config.storage.localSecret);
  if (payload.kind !== kind) throw badRequest("INVALID_TOKEN", "Invalid storage token.");
  if (!payload.exp || payload.exp < Date.now()) {
    throw new AppError(410, "UPLOAD_EXPIRED", "This media link has expired.");
  }
  return payload;
}

export function localFilePath(key: string) {
  return localPathForKey(key);
}

class LocalStorageProvider implements StorageProvider {
  readonly driver = "local" as const;

  constructor() {
    fs.mkdirSync(config.storage.localDir, { recursive: true });
  }

  async createUploadUrl(key: string, mimeType: string): Promise<UploadTarget> {
    const token = signPayload(
      {
        key,
        mime: mimeType,
        exp: Date.now() + config.storage.uploadUrlTtlSeconds * 1000,
        kind: "upload",
      } satisfies LocalTokenPayload,
      config.storage.localSecret
    );
    return {
      url: `${config.publicBaseUrl}/api/dev/storage/upload?token=${encodeURIComponent(token)}`,
      method: "PUT",
      headers: { "Content-Type": mimeType },
      expiresInSeconds: config.storage.uploadUrlTtlSeconds,
    };
  }

  async stat(key: string): Promise<StoredObject | null> {
    try {
      const info = await fsp.stat(localPathForKey(key));
      return { size: info.size, contentType: null };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async readHead(key: string, bytes: number): Promise<Buffer> {
    const handle = await fsp.open(localPathForKey(key), "r");
    try {
      const buffer = Buffer.alloc(bytes);
      const { bytesRead } = await handle.read(buffer, 0, bytes, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fsp.unlink(localPathForKey(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  async getDownloadUrl(key: string, mimeType: string): Promise<string> {
    const token = signPayload(
      {
        key,
        mime: mimeType,
        exp: Date.now() + config.storage.downloadUrlTtlSeconds * 1000,
        kind: "download",
      } satisfies LocalTokenPayload,
      config.storage.localSecret
    );
    return `${config.publicBaseUrl}/api/dev/storage/download?token=${encodeURIComponent(token)}`;
  }

  async downloadToFile(key: string, destination: string): Promise<void> {
    await fsp.mkdir(path.dirname(destination), { recursive: true });
    await fsp.copyFile(localPathForKey(key), destination);
  }
}

export const storage: StorageProvider = new LocalStorageProvider();

export async function writeLocalUpload(key: string, content: Buffer) {
  const destination = localPathForKey(key);
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  const temp = `${destination}.${process.pid}.${Date.now()}.tmp`;
  await fsp.writeFile(temp, content);
  await fsp.rename(temp, destination);
}

export async function openLocalDownload(key: string) {
  const filePath = localPathForKey(key);
  try {
    const info = await fsp.stat(filePath);
    if (!info.isFile()) throw notFound("MEDIA_NOT_FOUND", "That media file does not exist.");
    return { filePath, size: info.size };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw notFound("MEDIA_NOT_FOUND", "That media file does not exist.");
    }
    throw error;
  }
}

export function readableLocalFile(filePath: string) {
  return Readable.from(fs.createReadStream(filePath));
}

export function storageDriver() {
  return storage.driver;
}
