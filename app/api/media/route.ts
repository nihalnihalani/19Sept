import { NextResponse } from "next/server";
import { getSession } from "@/lib/neo4j";
import type { MediaMetadata } from "@/lib/types";

export const runtime = "nodejs";

function validate(body: any): { ok: true; data: MediaMetadata } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON body" };
  const { id, url, type } = body;
  if (!id || typeof id !== "string") return { ok: false, error: "Field 'id' is required (string)" };
  if (!url || typeof url !== "string") return { ok: false, error: "Field 'url' is required (string)" };
  if (!type || !["image", "video", "audio", "other"].includes(type)) return { ok: false, error: "Field 'type' must be one of: image, video, audio, other" };
  return { ok: true, data: body as MediaMetadata };
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    let url = searchParams.get("url");
    // Try reading JSON body too (optional)
    try {
      const body = await request.json().catch(() => null);
      if (body && typeof body === "object") {
        id = (body as any).id ?? id;
        url = (body as any).url ?? url;
      }
    } catch {}

    if (!id && !url) {
      return NextResponse.json({ error: "Provide 'id' or 'url' to delete" }, { status: 400 });
    }

    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (m:Media)
         WHERE ($id IS NOT NULL AND m.id = $id)
            OR ($url IS NOT NULL AND m.url = $url)
         WITH collect(m) AS ms
         CALL {
           WITH ms
           UNWIND ms AS x
           DETACH DELETE x
           RETURN count(*) AS c
         }
         RETURN c AS deleted`,
        { id: id || null, url: url || null }
      );
      const deleted = result.records[0]?.get("deleted") ?? 0;
      return NextResponse.json({ deleted });
    } finally {
      await session.close();
    }
  } catch (err: any) {
    console.error("/api/media DELETE error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // image | video | audio | other
    const tag = searchParams.get("tag");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (m:Media)
         OPTIONAL MATCH (m)-[:TAGGED_WITH]->(t:Tag)
         WITH m, collect(DISTINCT t.name) AS tags
         WHERE ($type IS NULL OR m.type = $type)
           AND ($tag IS NULL OR $tag IN tags)
         RETURN {
           id: m.id,
           url: m.url,
           type: m.type,
           title: m.title,
           description: m.description,
           width: m.width,
           height: m.height,
           duration: m.duration,
           size: m.size,
           checksum: m.checksum,
           createdAt: CASE WHEN m.createdAt IS NULL THEN NULL ELSE toString(m.createdAt) END,
           tags: tags
         } AS media
         ORDER BY coalesce(m.createdAt, datetime('1970-01-01T00:00:00Z')) DESC, m.id DESC
         SKIP toInteger($offset) LIMIT toInteger($limit)`,
        { type: type || null, tag: tag || null, limit, offset }
      );

      const media = result.records.map(r => r.get("media"));
      return NextResponse.json({ media, page: { limit, offset, count: media.length } });
    } finally {
      await session.close();
    }
  } catch (err: any) {
    console.error("/api/media GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validation = validate(json);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    const session = getSession();
    try {
      // Ensure indexes/constraints (optional, runs each time idempotently on Neo4j >= 5)
      await session.run(
        "CREATE CONSTRAINT media_id IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE"
      );
      await session.run(
        "CREATE INDEX tag_name IF NOT EXISTS FOR (t:Tag) ON (t.name)"
      );

      const result = await session.run(
        `MERGE (m:Media {id: $id})
         ON CREATE SET m.createdAt = coalesce(datetime($createdAt), datetime()),
                       m.url = $url,
                       m.type = $type,
                       m.title = $title,
                       m.description = $description,
                       m.width = $width,
                       m.height = $height,
                       m.duration = $duration,
                       m.size = $size,
                       m.checksum = $checksum
         ON MATCH SET  m.url = $url,
                       m.type = $type,
                       m.title = $title,
                       m.description = $description,
                       m.width = $width,
                       m.height = $height,
                       m.duration = $duration,
                       m.size = $size,
                       m.checksum = $checksum
         WITH m
         UNWIND coalesce($tags, []) AS tag
         MERGE (t:Tag {name: tag})
         MERGE (m)-[:TAGGED_WITH]->(t)
         RETURN m { .* } AS media`,
        {
          id: data.id,
          url: data.url,
          type: data.type,
          title: data.title ?? null,
          description: data.description ?? null,
          createdAt: data.createdAt ?? null,
          width: data.width ?? null,
          height: data.height ?? null,
          duration: data.duration ?? null,
          size: data.size ?? null,
          checksum: data.checksum ?? null,
          tags: data.tags ?? [],
        }
      );

      const record = result.records[0];
      const media = record?.get("media") ?? null;
      return NextResponse.json({ media }, { status: 201 });
    } finally {
      await session.close();
    }
  } catch (err: any) {
    console.error("/api/media POST error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
