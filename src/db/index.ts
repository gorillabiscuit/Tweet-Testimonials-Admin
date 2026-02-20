import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as path from "path";
import * as fs from "fs";
import { testimonials } from "./schema";

const raw = process.env.DATABASE_URL ?? "file:./data/testimonials.db";
const relativePath = raw.replace(/^file:/i, "").trim();
const dbPath = path.isAbsolute(relativePath)
  ? relativePath
  : path.join(process.cwd(), relativePath);

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema: { testimonials } });
