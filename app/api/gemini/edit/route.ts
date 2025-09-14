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
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const form = await req.formData();
    const prompt = (form.get("prompt") as string) || "";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Handle multiple image files
    const imageFiles = form.getAll("imageFiles");
    console.log("Received imageFiles from form:", imageFiles.length);

    const contents: (
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    )[] = [];

    // Add the prompt as text
    contents.push({ text: prompt });

    // Process each image file
    for (const imageFile of imageFiles) {
      if (imageFile && imageFile instanceof File) {
        const buf = await imageFile.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        contents.push({
          inlineData: {
            mimeType: imageFile.type || "image/png",
            data: b64,
          },
        });
      }
    }

    // Handle single image (backward compatibility)
    const singleImageFile = form.get("imageFile");
    if (
      singleImageFile &&
      singleImageFile instanceof File &&
      contents.length === 1
    ) {
      const buf = await singleImageFile.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      contents.push({
        inlineData: {
          mimeType: singleImageFile.type || "image/png",
          data: b64,
        },
      });
    }

    // Handle base64 image (for generated images)
    const imageBase64 = (form.get("imageBase64") as string) || undefined;
    const imageMimeType = (form.get("imageMimeType") as string) || undefined;

    if (imageBase64 && contents.length === 1) {
      const cleaned = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      contents.push({
        inlineData: {
          mimeType: imageMimeType || "image/png",
          data: cleaned,
        },
      });
    }

    if (contents.length < 2) {
      return NextResponse.json(
        { error: "No images provided for editing" },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: contents,
    });

    // Process the response to extract the image
    let imageData = null;
    let responseMimeType = "image/png";

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log("Generated text:", part.text);
      } else if (part.inlineData) {
        imageData = part.inlineData.data;
        responseMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    // Persist edited image to public/ (best-effort local cache)
    const ext = responseMimeType.includes("jpeg") || responseMimeType.includes("jpg")
      ? "jpg"
      : responseMimeType.includes("webp")
      ? "webp"
      : "png";
    const fileName = `edited_image_${Date.now()}.${ext}`;
    const publicPath = path.join(process.cwd(), "public", fileName);
    const buffer = Buffer.from(imageData, "base64");
    await writeFile(publicPath, buffer);

    // Insert into Neo4j with inline image bytes and streaming URL
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
          title: "Edited Image",
          description: "Edited via Gemini 2.5 Flash",
          createdAt,
          size: buffer.length,
          imageBytes: imageData,
          mimeType: responseMimeType,
          tags: ["edited", "gemini", "flash"],
        }
      );
      media = result.records[0]?.get("media") ?? null;
    } finally {
      await session.close();
    }

    return NextResponse.json({
      image: {
        imageBytes: imageData,
        mimeType: responseMimeType,
        url: `/api/media/file?id=${media?.id ?? ''}`,
      },
      media,
    });
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    return NextResponse.json(
      { error: "Failed to edit image" },
      { status: 500 }
    );
  }
}