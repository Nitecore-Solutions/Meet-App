import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "../config";
import { logger } from "../utils/logger";

const execFileAsync = promisify(execFile);

let warnedProbeUnavailable = false;

export async function probeVideoDuration(filePath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync(
      config.media.ffprobePath,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { timeout: 20_000, windowsHide: true, maxBuffer: 1024 * 1024 }
    );
    const duration = Number.parseFloat(String(stdout).trim());
    return Number.isFinite(duration) ? duration : null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" && !warnedProbeUnavailable) {
      warnedProbeUnavailable = true;
      logger.warn(
        "ffprobe is not installed - falling back to client-declared video duration in development",
        { configure: "Set FFPROBE_PATH or install ffmpeg, and REQUIRE_VIDEO_PROBE=true in production." }
      );
    } else {
      logger.debug("Video duration probe failed", {
        filePath,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return null;
  }
}
