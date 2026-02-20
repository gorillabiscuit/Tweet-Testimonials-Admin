import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getAvatarsDir, ensureUploadDirs, ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE_BYTES } from "@/lib/upload";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const isActiveParam = searchParams.get("isActive");

  const rows = await db.select().from(testimonials).orderBy(asc(testimonials.sortOrder));
  let filtered = rows;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.handle.toLowerCase().includes(s) ||
        r.tweetText.toLowerCase().includes(s) ||
        r.authorName.toLowerCase().includes(s)
    );
  }
  if (isActiveParam === "true" || isActiveParam === "false") {
    filtered = filtered.filter((r) => r.isActive === (isActiveParam === "true"));
  }

  return NextResponse.json(filtered.map(rowToTestimonial));
}

function rowToTestimonial(row: typeof testimonials.$inferSelect) {
  return {
    id: row.id,
    tweetId: row.tweetId ?? "",
    tweetUrl: row.tweetUrl,
    authorName: row.authorName,
    handle: row.handle,
    avatarFileName: row.avatarFileName,
    tweetText: row.tweetText,
    displayText: row.displayText ?? "",
    date: row.date,
    columnIndex: row.columnIndex,
    sortOrder: row.sortOrder,
    channel: row.channel as "x",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isActive: row.isActive,
  };
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let body: Record<string, unknown>;
  let avatarFile: { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> } | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const tweetUrl = formData.get("tweetUrl") as string;
    const authorName = formData.get("authorName") as string;
    const handle = formData.get("handle") as string;
    const tweetText = formData.get("tweetText") as string;
    const displayText = (formData.get("displayText") as string) ?? "";
    const date = formData.get("date") as string;
    const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";
    const file = formData.get("avatar") as File | null;
    const fetchedAvatarToken = (formData.get("fetchedAvatarToken") as string) ?? "";
    const insertPositionRaw = formData.get("insertPosition") as string | null;
    let insertPosition: "top" | "bottom" | { afterId: string } = "bottom";
    if (insertPositionRaw === "top" || insertPositionRaw === "bottom") {
      insertPosition = insertPositionRaw;
    } else if (insertPositionRaw && insertPositionRaw.startsWith("after:")) {
      insertPosition = { afterId: insertPositionRaw.slice(6) };
    }
    body = {
      tweetUrl,
      authorName,
      handle,
      tweetText,
      displayText,
      date,
      isActive,
      insertPosition,
      fetchedAvatarToken: fetchedAvatarToken || undefined,
    };
    if (file && file.size > 0) {
      avatarFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        arrayBuffer: () => file.arrayBuffer(),
      };
    } else if (fetchedAvatarToken && /^temp-[a-f0-9-]+\.(jpg|jpeg|png)$/i.test(fetchedAvatarToken)) {
      avatarFile = { fetchedToken: fetchedAvatarToken } as unknown as { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> };
    }
  } else {
    body = await request.json();
  }

  const { tweetUrl, authorName, handle, tweetText, displayText, date, insertPosition, isActive } = body as {
    tweetUrl: string;
    authorName: string;
    handle: string;
    tweetText: string;
    displayText?: string;
    date: string;
    insertPosition?: "top" | "bottom" | { afterId: string };
    isActive?: boolean;
  };

  if (!tweetUrl || !handle || !tweetText || !date) {
    return NextResponse.json(
      { error: "Missing required fields: tweetUrl, handle, tweetText, date" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const position = insertPosition ?? "bottom";
  const existing = await db.select().from(testimonials).orderBy(asc(testimonials.sortOrder));
  let newSortOrder: number;
  if (position === "top") {
    newSortOrder = 0;
    for (const r of existing) {
      await db.update(testimonials).set({ sortOrder: r.sortOrder + 1, updatedAt: now }).where(eq(testimonials.id, r.id));
    }
  } else if (position === "bottom") {
    newSortOrder = existing.length;
  } else {
    const afterRow = existing.find((r) => r.id === position.afterId);
    if (!afterRow) {
      return NextResponse.json({ error: "Invalid insertPosition: afterId not found" }, { status: 400 });
    }
    newSortOrder = afterRow.sortOrder + 1;
    for (const r of existing) {
      if (r.sortOrder >= newSortOrder) {
        await db.update(testimonials).set({ sortOrder: r.sortOrder + 1, updatedAt: now }).where(eq(testimonials.id, r.id));
      }
    }
  }

  const avatarFileAny = avatarFile as { fetchedToken?: string; name?: string; type?: string; size?: number; arrayBuffer?: () => Promise<ArrayBuffer> } | null;
  let avatarFileName = "";
  if (avatarFileAny?.fetchedToken) {
    const avatarsDir = getAvatarsDir();
    const tempPath = path.join(avatarsDir, avatarFileAny.fetchedToken);
    if (!fs.existsSync(tempPath)) {
      return NextResponse.json({ error: "Fetched avatar expired. Please fetch again or upload an image." }, { status: 400 });
    }
    const ext = path.extname(avatarFileAny.fetchedToken);
    avatarFileName = `${id}${ext}`;
    const destPath = path.join(avatarsDir, avatarFileName);
    fs.renameSync(tempPath, destPath);
  } else if (avatarFile) {
    if (!ALLOWED_AVATAR_TYPES.includes(avatarFile.type) || avatarFile.size > MAX_AVATAR_SIZE_BYTES) {
      return NextResponse.json({ error: "Invalid avatar file type or size" }, { status: 400 });
    }
    const ext = path.extname(avatarFile.name) || ".jpg";
    avatarFileName = `${id}${ext}`;
    ensureUploadDirs();
    const avatarsDir = getAvatarsDir();
    const destPath = path.join(avatarsDir, avatarFileName);
    const buf = await avatarFile.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buf));
  } else {
    return NextResponse.json({ error: "Avatar is required. Use “Fetch from tweet” or upload an image." }, { status: 400 });
  }

  await db.insert(testimonials).values({
    id,
    tweetId: "",
    tweetUrl,
    authorName: authorName ?? "",
    handle,
    avatarFileName,
    tweetText,
    displayText: displayText ?? "",
    date: date.slice(0, 10),
    columnIndex: 0,
    sortOrder: newSortOrder,
    channel: "x",
    createdAt: now,
    updatedAt: now,
    isActive: isActive !== false,
  });

  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  return NextResponse.json(row ? rowToTestimonial(row) : { id, tweetUrl, handle, tweetText, date, columnIndex: 0, sortOrder: newSortOrder });
}
