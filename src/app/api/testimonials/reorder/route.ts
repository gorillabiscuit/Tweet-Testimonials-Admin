import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { eq, asc, sql, lt, gt } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, direction } = body as { id: string; direction: "up" | "down" | "top" | "bottom" };
  if (!id || !["up", "down", "top", "bottom"].includes(direction)) {
    return NextResponse.json({ error: "Missing id or direction (up/down/top/bottom)" }, { status: 400 });
  }

  const [current] = await db.select().from(testimonials).where(eq(testimonials.id, id));
  if (!current) {
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  }

  const all = await db.select().from(testimonials).orderBy(asc(testimonials.sortOrder));
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();

  if (direction === "top") {
    await db
      .update(testimonials)
      .set({ sortOrder: sql`${testimonials.sortOrder} + 1`, updatedAt: now })
      .where(lt(testimonials.sortOrder, current.sortOrder));
    await db.update(testimonials).set({ sortOrder: 0, updatedAt: now }).where(eq(testimonials.id, id));
    return NextResponse.json({ ok: true });
  }

  if (direction === "bottom") {
    const maxOrder = all.length - 1;
    await db
      .update(testimonials)
      .set({ sortOrder: sql`${testimonials.sortOrder} - 1`, updatedAt: now })
      .where(gt(testimonials.sortOrder, current.sortOrder));
    await db.update(testimonials).set({ sortOrder: maxOrder, updatedAt: now }).where(eq(testimonials.id, id));
    return NextResponse.json({ ok: true });
  }

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) {
    return NextResponse.json({ ok: true });
  }
  const other = all[swapIdx];
  await db.update(testimonials).set({ sortOrder: other.sortOrder, updatedAt: now }).where(eq(testimonials.id, id));
  await db.update(testimonials).set({ sortOrder: current.sortOrder, updatedAt: now }).where(eq(testimonials.id, other.id));

  return NextResponse.json({ ok: true });
}
