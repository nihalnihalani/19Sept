import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/neo4j";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = (body?.prompt as string) || "";
    const model = (body?.model as string) || "gemini-2.5-flash-image-preview";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Generate via Gemini image-preview
    const modelInstance = ai.getGenerativeModel({ model });
    const resp = await modelInstance.generateContent({
      contents: [
        { role: "user", parts: [{ text: prompt }] },
      ],
    });

    const parts = (resp as any)?.response?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p?.inlineData?.data);
    if (!imagePart) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }
    const image = { imageBytes: imagePart.inlineData.data as string, mimeType: imagePart.inlineData.mimeType || "image/png" };

    // 1) Persist image to public/ (best-effort local cache)
    const mimeType = image.mimeType || "image/png";
    const ext = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
    const fileName = `generated_image_${Date.now()}.${ext}`;
    const publicPath = path.join(process.cwd(), "public", fileName);
    const fileBuffer = Buffer.from(image.imageBytes, "base64");
    await writeFile(publicPath, fileBuffer);

    // 2) Insert image bytes + metadata into Neo4j and point URL to streaming endpoint
    const session = getSession();
    let mediaRecord: any = null;
    try {
      await session.run(
        "CREATE CONSTRAINT media_id IF NOT EXISTS FOR (m:Media) REQUIRE m.id IS UNIQUE"
      );
      await session.run(
        "CREATE INDEX tag_name IF NOT EXISTS FOR (t:Tag) ON (t.name)"
      );
      const createdAt = new Date().toISOString();
      const id = `media-${Date.now()}`;
      const result = await session.run(
        `MERGE (m:Media {id: $id})
         ON CREATE SET m.createdAt = datetime($createdAt),
                       m.url = $url,
                       m.type = 'image',
                       m.title = $title,
                       m.description = $description,
                       m.size = $size,
                       m.imageBytes = $imageBytes,
                       m.mimeType = $mimeType
         ON MATCH SET  m.url = $url,
                       m.type = 'image',
                       m.title = $title,
                       m.description = $description,
                       m.size = $size,
                       m.imageBytes = $imageBytes,
                       m.mimeType = $mimeType
         WITH m
         UNWIND $tags AS tag
         MERGE (t:Tag {name: tag})
         MERGE (m)-[:TAGGED_WITH]->(t)
         RETURN m { .* } AS media`,
        {
          id,
          url: `/api/media/file?id=${id}`,
          title: prompt.slice(0, 80),
          description: `Generated from prompt: ${prompt}`,
          createdAt,
          size: fileBuffer.length,
          imageBytes: image.imageBytes,
          mimeType,
          tags: prompt
            .toLowerCase()
            .split(/[^a-z0-9]+/g)
            .filter(Boolean)
            .slice(0, 5),
        }
      );
      mediaRecord = result.records[0]?.get("media") ?? null;
    } catch (e) {
      console.error("Failed to insert media into Neo4j:", e);
    } finally {
      await session.close();
    }

    // 3) Return both the base64 (for backward compatibility) and the streamable URL
    return NextResponse.json({
      image: {
        imageBytes: image.imageBytes,
        mimeType,
        url: mediaRecord?.url || `/api/media/file?id=${mediaRecord?.id ?? ''}`,
      },
      media: mediaRecord,
    });
  } catch (error: any) {
    // Surface more details for debugging
    console.error("Error generating image:", error);
    const message = error?.message || error?.toString?.() || "Failed to generate image";
    // Some SDK errors may include a response body
    const details = (error?.response && (await error.response.text?.().catch(() => null))) || null;
    return NextResponse.json(
      { error: message, details },
      { status: 500 }
    );
  }
}

