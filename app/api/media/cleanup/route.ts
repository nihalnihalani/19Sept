import { NextResponse } from "next/server";
import { getAllMedia, deleteMedia } from "@/lib/database";
import path from "path";
import { access } from "fs/promises";

export const runtime = "nodejs";

async function fileExists(absPath: string): Promise<boolean> {
  try {
    await access(absPath);
    return true;
  } catch {
    return false;
  }
}

export async function POST() {
  try {
    // Get all media from database
    const mediaList = await getAllMedia(2000); // Get up to 2000 records

    const missing: Array<{ id: string; url: string }> = [];
    for (const m of mediaList) {
      const url = m.url || "";
      if (!url || !url.startsWith("/")) continue;
      const rel = url.replace(/^\//, "");
      const abs = path.join(process.cwd(), "public", rel);
      // Only check local files we expect under public/
      const exists = await fileExists(abs);
      if (!exists) missing.push({ id: m.id, url });
    }

    let deleted = 0;
    if (missing.length > 0) {
      // Delete missing media records
      for (const m of missing) {
        const success = await deleteMedia(m.id);
        if (success) deleted++;
      }
    }

    return NextResponse.json({
      scanned: mediaList.length,
      missing: missing.length,
      deleted,
    });
  } catch (err: any) {
    console.error("/api/media/cleanup POST error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
