import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, direction } = body as { id: string; direction: "up" | "down" };
  if (!id || (direction !== "up" && direction !== "down")) {
    return NextResponse.json({ error: "Missing id or direction (up/down)" }, { status: 400 });
  }

  const [current] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!current) {
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  }

  const siblings = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.columnIndex, current.columnIndex))
    .orderBy(asc(testimonials.sortOrder));

  const idx = siblings.findIndex((s) => s.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found in column" }, { status: 404 });

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) {
    return NextResponse.json({ ok: true });
  }

  const other = siblings[swapIdx];
  const now = new Date().toISOString();

  await db.update(testimonials).set({ sortOrder: other.sortOrder, updatedAt: now }).where(eq(testimonials.id, id));
  await db.update(testimonials).set({ sortOrder: current.sortOrder, updatedAt: now }).where(eq(testimonials.id, other.id));

  return NextResponse.json({ ok: true });
}
