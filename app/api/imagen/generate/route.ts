import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFile } from "fs/promises";
import path from "path";
import { insertMedia } from "@/lib/database";

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

    // 2) Insert metadata into SQLite database
    let mediaRecord: any = null;
    try {
      const id = `media-${Date.now()}`;
      const tags = prompt
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter(Boolean)
        .slice(0, 5);
      
      mediaRecord = await insertMedia({
        id,
        url: `/${fileName}`, // Direct file URL
        type: 'image',
        title: prompt.slice(0, 80),
        description: `Generated from prompt: ${prompt}`,
        size: fileBuffer.length,
        tags
      });
    } catch (e) {
      console.error("Failed to insert media into database:", e);
    }

    // 3) Return both the base64 (for backward compatibility) and the streamable URL
    return NextResponse.json({
      image: {
        imageBytes: image.imageBytes,
        mimeType,
        url: mediaRecord?.url || `/${fileName}`,
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

