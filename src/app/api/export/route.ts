import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { buildTestimonialsJson, getAvatarPath } from "@/lib/export-bundle";
import type { Testimonial } from "@/types/testimonial";
import archiver from "archiver";
import { PassThrough } from "stream";
import { Readable } from "stream";

export async function GET() {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isActive, true))
    .orderBy(asc(testimonials.sortOrder));

  const activeTestimonials: Testimonial[] = rows.map((r) => ({
    id: r.id,
    tweetId: r.tweetId ?? "",
    tweetUrl: r.tweetUrl,
    authorName: r.authorName,
    handle: r.handle,
    avatarFileName: r.avatarFileName,
    tweetText: r.tweetText,
    displayText: r.displayText ?? "",
    date: r.date,
    columnIndex: r.columnIndex,
    sortOrder: r.sortOrder,
    channel: "x",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    isActive: r.isActive,
  }));

  const testimonialsJson = buildTestimonialsJson(activeTestimonials);
  const jsonString = JSON.stringify(testimonialsJson, null, 2);

  const now = new Date();
  const timestamp =
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "-" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0");
  const filename = `nftfi-testimonials-${timestamp}.zip`;

  const archive = archiver("zip", { zlib: { level: 9 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  archive.append(jsonString, { name: "data/testimonials.json" });

  for (const t of activeTestimonials) {
    const avatarPath = getAvatarPath(t.avatarFileName);
    if (avatarPath) {
      archive.file(avatarPath, { name: `public/tweets/avatars/${t.avatarFileName}` });
    }
  }

  archive.finalize();

  const webStream = Readable.toWeb(pass) as ReadableStream<Uint8Array>;
  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
