import { NextResponse } from "next/server";
import { getSession } from "@/lib/neo4j";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (m:Media {id: $id}) RETURN m { .* } AS media`,
      { id }
    );
    const media = result.records[0]?.get("media");
    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If it's an image stored as base64
    if (
      media.type === "image" &&
      typeof media.imageBytes === "string" &&
      media.imageBytes.length > 0
    ) {
      const mime = media.mimeType || "image/png";
      const buffer = Buffer.from(media.imageBytes, "base64");
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // For videos or images that don't have inline bytes, redirect to their URL if available
    if (typeof media.url === "string" && media.url) {
      return NextResponse.redirect(media.url, 302);
    }

    return NextResponse.json({ error: "No content available for this media" }, { status: 404 });
  } catch (err: any) {
    console.error("/api/media/file GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await session.close();
  }
}
