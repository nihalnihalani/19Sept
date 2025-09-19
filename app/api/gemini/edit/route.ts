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

    // Use Gemini image-preview model via @google/generative-ai
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    const parts: any[] = [];
    for (const c of contents) {
      if ((c as any).text) parts.push({ text: (c as any).text });
      if ((c as any).inlineData) parts.push({ inlineData: (c as any).inlineData });
    }
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
    });

    // Process the response to extract the image
    let imageData = null;
    let responseMimeType = "image/png";

    const partsOut = (response as any)?.response?.candidates?.[0]?.content?.parts || [];
    for (const part of partsOut) {
      if (part?.text) {
        console.log("Generated text:", part.text);
      } else if (part?.inlineData) {
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

    // Insert into database
    let media: any = null;
    try {
      const id = `media-${Date.now()}`;
      const tags = prompt
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .filter(Boolean)
        .slice(0, 5);
      
      media = await insertMedia({
        id,
        url: `/${fileName}`,
        type: 'image',
        title: "Edited Image",
        description: `Edited via Gemini from prompt: ${prompt}`,
        size: buffer.length,
        tags
      });
    } catch (e) {
      console.error("Failed to insert media into database:", e);
    }

    return NextResponse.json({
      image: {
        imageBytes: imageData,
        mimeType: responseMimeType,
        url: `/${fileName}`,
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