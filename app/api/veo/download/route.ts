import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/neo4j";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const uri: string | undefined = body?.uri || body?.file?.uri;
    const save: boolean = Boolean(body?.save);

    if (!uri) {
      return NextResponse.json({ error: "Missing file uri" }, { status: 400 });
    }

    const resp = await fetch(uri, {
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY as string,
        Accept: "*/*",
      },
      redirect: "follow",
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Upstream download failed: ${resp.status} ${resp.statusText}`,
          details: text,
        },
        { status: 502 }
      );
    }

    // If client requested saving, persist to disk and Neo4j, return JSON
    if (save) {
      const arrayBuffer = await resp.arrayBuffer();
      const mimeType = resp.headers.get("content-type") || "video/mp4";
      const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogv" : "mp4";
      const fileName = `generated_video_${Date.now()}.${ext}`;
      const publicPath = path.join(process.cwd(), "public", fileName);
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(publicPath, buffer);

      // Insert metadata into Neo4j (best-effort)
      const session = getSession();
      let media: any = null;
      try {
        await session.run(
          "CREATE CONSTRAINT media_id IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE"
        );
        await session.run(
          "CREATE INDEX tag_name IF NOT EXISTS FOR (t:Tag) ON (t.name)"
        );
        // NOTE: Do NOT attempt to create a URL uniqueness constraint at runtime.
        // Existing duplicate data in development can cause constraint creation to fail noisily.
        // We rely on MERGE (m:Media {url: $url}) below for idempotency per URL.
        const createdAt = new Date().toISOString();
        const result = await session.run(
          `MERGE (m:Media {url: $url})
           ON CREATE SET m.id = coalesce($id, randomUUID()),
                         m.createdAt = datetime($createdAt),
                         m.type = 'video',
                         m.title = $title,
                         m.description = $description,
                         m.size = $size
           ON MATCH SET  m.type = 'video',
                         m.title = $title,
                         m.description = $description,
                         m.size = $size
           RETURN m { .* } AS media`,
          {
            id: `media-${Date.now()}`,
            url: `/${fileName}`,
            title: "Generated Video",
            description: "Generated via Veo and saved by server",
            createdAt,
            size: buffer.length,
          }
        );
        media = result.records[0]?.get("media") ?? null;
      } catch (e) {
        console.error("Failed to insert video media into Neo4j:", e);
      } finally {
        await session.close();
      }

      return NextResponse.json({
        url: `/${fileName}`,
        mimeType,
        size: buffer.length,
        media,
      });
    }

    // Default: stream the content through
    if (resp.body) {
      return new Response(resp.body, {
        status: 200,
        headers: {
          "Content-Type": resp.headers.get("content-type") || "video/mp4",
          "Content-Disposition": `inline; filename="veo3_video.mp4"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const arrayBuffer = await resp.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": resp.headers.get("content-type") || "video/mp4",
        "Content-Disposition": `inline; filename="veo3_video.mp4"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Error downloading video:", error);
    return NextResponse.json(
      { error: "Failed to download video" },
      { status: 500 }
    );
  }
}
