import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAvatarsDir, ensureUploadDirs, ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE_BYTES } from "@/lib/upload";
import path from "path";
import fs from "fs";

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rowToTestimonial(row));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const [existing] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let body: Record<string, unknown>;
  let avatarFile: { name: string; type: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> } | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    body = {
      tweetUrl: formData.get("tweetUrl"),
      authorName: formData.get("authorName"),
      handle: formData.get("handle"),
      tweetText: formData.get("tweetText"),
      displayText: formData.get("displayText"),
      date: formData.get("date"),
      columnIndex: Number(formData.get("columnIndex")),
      sortOrder: formData.get("sortOrder") !== null && formData.get("sortOrder") !== "" ? Number(formData.get("sortOrder")) : existing.sortOrder,
      isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
    };
    const file = formData.get("avatar") as File | null;
    if (file && file.size > 0) {
      avatarFile = {
        name: file.name,
        type: file.type,
        size: file.size,
        arrayBuffer: () => file.arrayBuffer(),
      };
    }
  } else {
    body = await request.json();
  }

  const tweetUrl = (body.tweetUrl as string) ?? existing.tweetUrl;
  const authorName = (body.authorName as string) ?? existing.authorName;
  const handle = (body.handle as string) ?? existing.handle;
  const tweetText = (body.tweetText as string) ?? existing.tweetText;
  const displayText = (body.displayText as string) ?? existing.displayText ?? "";
  const date = (body.date as string) ?? existing.date;
  const columnIndex = typeof body.columnIndex === "number" ? Math.min(4, Math.max(0, body.columnIndex)) : existing.columnIndex;
  const sortOrder = typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder) ? body.sortOrder : existing.sortOrder;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : existing.isActive;

  let avatarFileName = existing.avatarFileName;
  if (avatarFile) {
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
  }

  const now = new Date().toISOString();
  await db
    .update(testimonials)
    .set({
      tweetUrl,
      authorName,
      handle,
      tweetText,
      displayText,
      date: date.slice(0, 10),
      columnIndex,
      sortOrder,
      isActive,
      avatarFileName,
      updatedAt: now,
    })
    .where(eq(testimonials.id, id));

  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  return NextResponse.json(row ? rowToTestimonial(row) : { id });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.delete(testimonials).where(eq(testimonials.id, id));
  return NextResponse.json({ ok: true });
}
