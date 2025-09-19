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

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    // Process the response to extract the image
    let imageData: string | null = null;
    let imageMimeType = "image/png";
    let message: string | undefined;

    const first = (response as any)?.response?.candidates?.[0]?.content?.parts || [];
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

      let media: any = null;
      try {
        const id = `media-${Date.now()}`;
        const tags = title
          .toLowerCase()
          .split(/[^a-z0-9]+/g)
          .filter(Boolean)
          .slice(0, 5);
        
        media = await insertMedia({
          id,
          url: `/${fileName}`,
          type: 'image',
          title: title.slice(0, 80),
          description: `Edited via Gemini from prompt: ${prompt}`,
          size: buffer.length,
          tags
        });
      } catch (e) {
        console.error("Failed to insert media into database:", e);
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
