/**
 * Seed the database from data/tweets.html.
 * Run: npx tsx scripts/seed-from-tweets-html.ts
 *
 * Extracts author name + first tweet URL per list item.
 * Uses placeholder tweet text and avatar; fill in real content via the admin.
 */

import { db } from "../src/db";
import { testimonials } from "../src/db/schema";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

const HTML_PATH = path.join(process.cwd(), "data", "tweets.html");

interface ParsedItem {
  authorName: string;
  tweetUrl: string;
  handle: string;
  tweetId: string;
}

function extractHandleAndId(url: string): { handle: string; tweetId: string } {
  const match = url.match(/x\.com\/([^/]+)\/status\/(\d+)/i) || url.match(/twitter\.com\/([^/]+)\/status\/(\d+)/i);
  if (!match) return { handle: "", tweetId: "" };
  return { handle: `@${match[1]}`, tweetId: match[2] };
}

function parseHtml(html: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  for (const liMatch of liMatches) {
    const inner = liMatch[1];
    const linkMatch = inner.match(/href="(https?:\/\/x\.com\/[^"]+\/status\/\d+[^"]*)"/i);
    if (!linkMatch) continue;
    const tweetUrl = linkMatch[1].replace(/\?s=\d+$/, "").trim();
    const { handle, tweetId } = extractHandleAndId(tweetUrl);
    if (!handle || !tweetId) continue;
    const textBeforeLink = inner.replace(/<a[\s\S]*$/i, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const authorName = textBeforeLink.replace(/\s*Tweet\s*$/i, "").trim() || handle.slice(1) || "Unknown";
    items.push({ authorName, tweetUrl, handle, tweetId });
  }
  return items;
}

async function seed() {
  if (!fs.existsSync(HTML_PATH)) {
    console.error("Missing data/tweets.html");
    process.exit(1);
  }
  const html = fs.readFileSync(HTML_PATH, "utf-8");
  const parsed = parseHtml(html);
  console.log(`Parsed ${parsed.length} tweets from tweets.html`);

  const now = new Date().toISOString();
  const placeholderDate = "2024-01-01";
  const placeholderTweetText = "—"; // fill in via admin
  const placeholderAvatar = "placeholder.png";

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    const id = uuidv4();
    const columnIndex = i % 5;
    const sortOrder = Math.floor(i / 5);

    await db.insert(testimonials).values({
      id,
      tweetId: p.tweetId,
      tweetUrl: p.tweetUrl,
      authorName: p.authorName,
      handle: p.handle,
      avatarFileName: placeholderAvatar,
      tweetText: placeholderTweetText,
      displayText: "",
      date: placeholderDate,
      columnIndex,
      sortOrder,
      channel: "x",
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });
  }
  const avatarDir = path.join(process.cwd(), "data", "uploads", "avatars");
  const placeholderPath = path.join(avatarDir, "placeholder.png");
  if (!fs.existsSync(placeholderPath)) {
    const minimalPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.mkdirSync(avatarDir, { recursive: true });
    fs.writeFileSync(placeholderPath, minimalPng);
    console.log("Created data/uploads/avatars/placeholder.png");
  }
  console.log(`Inserted ${parsed.length} testimonials.`);
  console.log("Edit each row in the admin to set tweet text and upload real avatars.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
