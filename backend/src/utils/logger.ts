import { config } from "../config";

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof levels;

function enabled(level: Level) {
  const configured = (config.logLevel as Level) in levels ? (config.logLevel as Level) : "info";
  return levels[level] >= levels[configured];
}

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  if (!enabled(level)) return;
  const line = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  const output = JSON.stringify(line);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else if (level === "debug") console.debug(output);
  else console.log(output);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
