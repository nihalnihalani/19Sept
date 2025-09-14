import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { writeFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/neo4j";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = (body?.prompt as string) || "";
    const uploadedBase64: string | undefined = body?.imageBase64;
    const uploadedMime: string | undefined = body?.imageMimeType;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Helper to save any provided base64 image directly (edit mode upload)
    async function saveUploadedIfAny() {
      if (!uploadedBase64) return null;
      const mime = uploadedMime || "image/png";
      const { fileName, media } = await saveAndInsert(uploadedBase64, mime, prompt || "Uploaded image");
      return {
        image: {
          imageBytes: uploadedBase64,
          mimeType: mime,
          url: `/${fileName}`,
        },
        media,
        message: "Image uploaded",
      };
    }

    // If the client sent an image (edit mode), save it and return immediately
    if (uploadedBase64) {
      const uploadedSaved = await saveUploadedIfAny();
      if (uploadedSaved) return NextResponse.json(uploadedSaved);
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    // Process the response to extract the image
    let imageData: string | null = null;
    let imageMimeType = "image/png";
    let message: string | undefined;

    const first = response.candidates?.[0]?.content?.parts || [];
    for (const part of first) {
      if ((part as any).text) {
        message = (part as any).text as string;
      } else if ((part as any).inlineData) {
        imageData = (part as any).inlineData.data as string;
        imageMimeType = (part as any).inlineData.mimeType || "image/png";
        break;
      }
    }

    async function saveAndInsert(imageBytes: string, mimeType: string, title: string) {
      const ext = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
      const fileName = `generated_image_edit_${Date.now()}.${ext}`;
      const publicPath = path.join(process.cwd(), "public", fileName);
      const buffer = Buffer.from(imageBytes, "base64");
      // Best-effort local cache
      await writeFile(publicPath, buffer);

      const session = getSession();
      let media: any = null;
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
            title: title.slice(0, 80),
            description: `Edited via Gemini from prompt: ${prompt}`,
            createdAt,
            size: buffer.length,
            imageBytes,
            mimeType,
            tags: prompt
              .toLowerCase()
              .split(/[^a-z0-9]+/g)
              .filter(Boolean)
              .slice(0, 5),
          }
        );
        media = result.records[0]?.get("media") ?? null;
      } finally {
        await session.close();
      }
      return { fileName, media };
    }

    if (!imageData) {
      // Fallback: try Imagen to produce an image from the same prompt
      try {
        const imgResp = await ai.models.generateImages({
          model: "imagen-4.0-fast-generate-001",
          prompt,
          config: { aspectRatio: "16:9" },
        });
        const image = imgResp.generatedImages?.[0]?.image;
        if (image?.imageBytes) {
          const mime = image.mimeType || "image/png";
          const saved = await saveAndInsert(image.imageBytes, mime, prompt);
          return NextResponse.json({
            image: {
              imageBytes: image.imageBytes,
              mimeType: mime,
              url: `/${saved.fileName}`,
            },
            media: saved.media,
            message,
            fallback: "imagen",
          });
        }
      } catch (e: any) {
        const msg = e?.message || String(e);
        console.warn("Imagen fallback did not produce an image:", msg);
      }
      // If still no image, return a helpful 200 with message
      return NextResponse.json({
        message: message || "No image generated. Try a more specific prompt.",
        note: "Gemini returned text only and Imagen fallback did not produce an image.",
      });
    }

    // Save primary Gemini image and insert into Neo4j
    const saved = await saveAndInsert(imageData, imageMimeType, prompt);
    return NextResponse.json({
      image: {
        imageBytes: imageData,
        mimeType: imageMimeType,
        url: `/${saved.fileName}`,
      },
      media: saved.media,
      message,
    });
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
