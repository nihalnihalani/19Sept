import { NextResponse } from "next/server";
import { getMediaById } from "@/lib/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const media = await getMediaById(id);
    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Note: The original code checked for imageBytes, but our new schema doesn't store inline bytes
    // Instead, we'll redirect to the URL if available
    if (media.url) {
      return NextResponse.redirect(media.url, 302);
    }

    return NextResponse.json({ error: "No content available for this media" }, { status: 404 });
  } catch (err: any) {
    console.error("/api/media/file GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
