import path from "path";
import fs from "fs";

const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function getUploadDir(): string {
  const env = process.env.UPLOAD_DIR;
  if (env) {
    return path.isAbsolute(env) ? env : path.join(process.cwd(), env);
  }
  return DEFAULT_UPLOAD_DIR;
}

export function getAvatarsDir(): string {
  return path.join(getUploadDir(), "avatars");
}

export function ensureUploadDirs() {
  const avatars = getAvatarsDir();
  if (!fs.existsSync(avatars)) {
    fs.mkdirSync(avatars, { recursive: true });
  }
}

export const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png"];
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
