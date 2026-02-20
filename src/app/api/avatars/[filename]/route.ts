import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAvatarsDir } from "@/lib/upload";
import path from "path";
import fs from "fs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { filename } = await params;
  const safe = path.basename(filename);
  if (!safe || safe !== filename) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  const avatarsDir = getAvatarsDir();
  const filePath = path.join(avatarsDir, safe);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(safe).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";
  return new NextResponse(buf, {
    headers: { "Content-Type": contentType },
  });
}
