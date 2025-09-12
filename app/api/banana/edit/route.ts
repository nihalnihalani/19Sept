import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/neo4j";

// Banana.dev default endpoint
const BANANA_API_URL = process.env.BANANA_API_URL || "https://api.banana.dev/v1/run";
const BANANA_API_KEY = process.env.BANANA_API_KEY || process.env.GEMINI_API_KEY || "";
// Banana calls this "modelKey"; allow MODEL_ID for flexibility
const BANANA_MODEL_KEY = process.env.BANANA_MODEL_KEY || process.env.BANANA_MODEL_ID || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt: string = body?.prompt || "";
    const imageBase64: string | undefined = body?.imageBase64;
    const imageMimeType: string = body?.imageMimeType || "image/png";

    if (!BANANA_API_KEY || !BANANA_MODEL_KEY) {
      return NextResponse.json({ error: "BANANA_API_KEY or BANANA_MODEL_KEY missing in env" }, { status: 500 });
    }
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }
    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
    }

    // Call Banana edit model
    const bananaResp = await fetch(BANANA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: BANANA_API_KEY,
        modelKey: BANANA_MODEL_KEY,
        modelInputs: {
          prompt,
          image_base64: imageBase64,
          mime_type: imageMimeType,
        },
      }),
    });

    const bananaJson = await bananaResp.json();
    if (!bananaResp.ok) {
      return NextResponse.json({ error: bananaJson?.message || "Banana edit failed" }, { status: 502 });
    }

    // Many Banana templates return { modelOutputs: [{ image_base64, mime_type }] }
    const edited = bananaJson?.modelOutputs?.[0];
    const editedBase64: string | undefined = edited?.image_base64 || edited?.image_base64_str || edited?.imageBytes;
    const editedMime: string = edited?.mime_type || edited?.mimeType || imageMimeType;

    if (!editedBase64) {
      return NextResponse.json({ error: "No edited image returned from Banana" }, { status: 502 });
    }

    // Persist edited image
    const ext = editedMime.includes("jpeg") || editedMime.includes("jpg") ? "jpg" : editedMime.includes("webp") ? "webp" : "png";
    const fileName = `edited_image_${Date.now()}.${ext}`;
    const publicPath = path.join(process.cwd(), "public", fileName);
    const buffer = Buffer.from(editedBase64, "base64");
    await writeFile(publicPath, buffer);

    // Insert into Neo4j
    const session = getSession();
    let media: any = null;
    try {
      await session.run("CREATE CONSTRAINT media_id IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE");
      await session.run("CREATE INDEX tag_name IF NOT EXISTS FOR (t:Tag) ON (t.name)");
      const createdAt = new Date().toISOString();
      const result = await session.run(
        `MERGE (m:Media {id: $id})
         ON CREATE SET m.createdAt = datetime($createdAt),
                       m.url = $url,
                       m.type = 'image',
                       m.title = $title,
                       m.description = $description,
                       m.size = $size
         ON MATCH SET  m.url = $url,
                       m.type = 'image',
                       m.title = $title,
                       m.description = $description,
                       m.size = $size
         WITH m
         UNWIND $tags AS tag
         MERGE (t:Tag {name: tag})
         MERGE (m)-[:TAGGED_WITH]->(t)
         RETURN m { .* } AS media`,
        {
          id: `media-${Date.now()}`,
          url: `/${fileName}`,
          title: prompt.slice(0, 80),
          description: `Edited via Nano Banana from prompt: ${prompt}`,
          createdAt,
          size: buffer.length,
          tags: prompt.toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean).slice(0, 5),
        }
      );
      media = result.records[0]?.get("media") ?? null;
    } finally {
      await session.close();
    }

    return NextResponse.json({
      image: {
        imageBytes: editedBase64,
        mimeType: editedMime,
        url: `/${fileName}`,
      },
      media,
      message: "Edited successfully via Banana",
    });
  } catch (err: any) {
    console.error("/api/banana/edit error:", err);
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
