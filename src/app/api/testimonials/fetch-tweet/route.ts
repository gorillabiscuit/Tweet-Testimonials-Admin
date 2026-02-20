import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAvatarsDir, ensureUploadDirs } from "@/lib/upload";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const OEMBED_BASE = "https://publish.twitter.com/oembed";

function extractHandleFromAuthorUrl(authorUrl: string): string {
  const m = authorUrl.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i);
  return m ? `@${m[1]}` : "";
}

function extractTweetTextFromHtml(html: string): string {
  if (!html) return "";
  const pMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const raw = pMatch ? pMatch[1] : html;
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const url = (body.url ?? "").trim().replace(/\?s=\d+$/i, "");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  if (!/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+\/status\/\d+/i.test(url)) {
    return NextResponse.json({ error: "Invalid Twitter/X tweet URL" }, { status: 400 });
  }

  const oembedUrl = `${OEMBED_BASE}?url=${encodeURIComponent(url)}`;
  let res: Response;
  try {
    res = await fetch(oembedUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  } catch (e) {
    return NextResponse.json({ error: "Could not reach Twitter. Try again." }, { status: 502 });
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: "Tweet not found or unavailable." },
      { status: 404 }
    );
  }

  let data: { author_name?: string; author_url?: string; html?: string };
  try {
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "Invalid response from Twitter." }, { status: 502 });
  }

  const authorName = (data.author_name ?? "").trim() || "Unknown";
  const authorUrl = (data.author_url ?? "").trim();
  const handle = authorUrl ? extractHandleFromAuthorUrl(authorUrl) : "";
  const tweetText = data.html ? extractTweetTextFromHtml(data.html) : "";
  const today = new Date().toISOString().slice(0, 10);

  let avatarToken: string | null = null;
  let avatarDataUrl: string | null = null;
  const tryFetchAvatar = async (avatarUrl: string): Promise<boolean> => {
    if (!avatarUrl || !avatarUrl.startsWith("http")) return false;
    try {
      const imgRes = await fetch(avatarUrl, { signal: AbortSignal.timeout(8000) });
      if (!imgRes.ok) return false;
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.length === 0 || buf.length > 5 * 1024 * 1024) return false;
      ensureUploadDirs();
      const token = uuidv4();
      const ext = (avatarUrl.includes("png") ? ".png" : ".jpg");
      const tempName = `temp-${token}${ext}`;
      const avatarsDir = getAvatarsDir();
      fs.writeFileSync(path.join(avatarsDir, tempName), buf);
      avatarToken = tempName;
      const mime = ext === ".png" ? "image/png" : "image/jpeg";
      avatarDataUrl = `data:${mime};base64,${buf.toString("base64")}`;
      return true;
    } catch {
      return false;
    }
  };
  const imgMatch = data.html?.match(/<img[^>]+src=["']([^"']+)["']/i);
  const oembedImgUrl = imgMatch?.[1];
  if (oembedImgUrl) {
    await tryFetchAvatar(oembedImgUrl);
  }
  if (!avatarDataUrl && handle) {
    const username = handle.replace(/^@/, "");
    await tryFetchAvatar(`https://unavatar.io/twitter/${encodeURIComponent(username)}`);
  }

  return NextResponse.json({
    authorName,
    handle: handle || authorName,
    tweetText: tweetText || "—",
    date: today,
    avatarToken,
    avatarDataUrl,
  });
}
