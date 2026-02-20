import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { testimonials } from "@/db/schema";

function getStatusIdFromUrl(url: string): string | null {
  const trimmed = url.trim();
  const match = trimmed.match(/\/status\/(\d+)/i);
  return match ? match[1] : null;
}

function normalizeTweetUrl(url: string): string {
  const u = url.trim().toLowerCase().replace(/\/+$/, "");
  const id = getStatusIdFromUrl(u);
  return id ?? u;
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tweetUrl = searchParams.get("tweetUrl");
  if (!tweetUrl || !tweetUrl.trim()) {
    return NextResponse.json({ duplicate: false });
  }

  const normalizedInput = normalizeTweetUrl(tweetUrl);
  const statusId = getStatusIdFromUrl(tweetUrl);

  const rows = await db.select({ tweetUrl: testimonials.tweetUrl, tweetId: testimonials.tweetId }).from(testimonials);

  const duplicate = rows.some((r) => {
    const existingNorm = normalizeTweetUrl(r.tweetUrl);
    if (normalizedInput === existingNorm) return true;
    if (statusId && r.tweetId && r.tweetId === statusId) return true;
    return false;
  });

  return NextResponse.json({ duplicate });
}
