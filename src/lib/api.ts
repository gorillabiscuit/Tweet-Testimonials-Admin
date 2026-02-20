import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getTestimonial(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const [row] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!row) return null;
  return {
    id: row.id,
    tweetUrl: row.tweetUrl,
    authorName: row.authorName,
    handle: row.handle,
    tweetText: row.tweetText,
    displayText: row.displayText ?? "",
    date: row.date,
    columnIndex: row.columnIndex,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    avatarFileName: row.avatarFileName,
  };
}
