import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gemini Edit API Handler
export async function geminiEdit(req: Request) {
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

    return NextResponse.json({
      image: {
        imageBytes: imageData,
        mimeType: responseMimeType,
      },
    });
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    return NextResponse.json(
      { error: "Failed to edit image" },
      { status: 500 }
    );
  }
}

// Gemini Generate API Handler
export async function geminiGenerate(req: Request) {
  try {
    const body = await req.json();
    const prompt = (body?.prompt as string) || "";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    // Process the response to extract the image
    let imageData = null;
    let imageMimeType = "image/png";

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log("Generated text:", part.text);
      } else if (part.inlineData) {
        imageData = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    return NextResponse.json({
      image: {
        imageBytes: imageData,
        mimeType: imageMimeType,
      },
    });
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

// Imagen Generate API Handler
export async function imagenGenerate(req: Request) {
  try {
    const body = await req.json();
    const prompt = (body?.prompt as string) || "";
    const model = (body?.model as string) || "imagen-4.0-fast-generate-001";

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const resp = await ai.models.generateImages({
      model,
      prompt,
      config: {
        aspectRatio: "16:9",
      },
    });

    const image = resp.generatedImages?.[0]?.image;
    if (!image?.imageBytes) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    return NextResponse.json({
      image: {
        imageBytes: image.imageBytes,
        mimeType: image.mimeType || "image/png",
      },
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

// Veo Download API Handler
export async function veoDownload(req: Request) {
  try {
    const body = await req.json();
    const uri: string | undefined = body?.uri || body?.file?.uri;

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

// Veo Generate API Handler
export async function veoGenerate(req: Request) {
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
    const model = (form.get("model") as string) || "veo-3.0-generate-001";
    const negativePrompt = (form.get("negativePrompt") as string) || undefined;
    const aspectRatio = (form.get("aspectRatio") as string) || undefined;

    const imageFile = form.get("imageFile");
    const imageBase64 = (form.get("imageBase64") as string) || undefined;
    const imageMimeType = (form.get("imageMimeType") as string) || undefined;

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    let image: { imageBytes: string; mimeType: string } | undefined;

    if (imageFile && imageFile instanceof File) {
      const buf = await imageFile.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      image = { imageBytes: b64, mimeType: imageFile.type || "image/png" };
    } else if (imageBase64) {
      const cleaned = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      image = { imageBytes: cleaned, mimeType: imageMimeType || "image/png" };
    }

    const operation = await ai.models.generateVideos({
      model,
      prompt,
      ...(image ? { image } : {}),
      config: {
        ...(aspectRatio ? { aspectRatio } : {}),
        ...(negativePrompt ? { negativePrompt } : {}),
      },
    });

    const name = (operation as unknown as { name?: string }).name;
    return NextResponse.json({ name });
  } catch (error: unknown) {
    console.error("Error starting Veo generation:", error);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 }
    );
  }
}

// Veo Operation API Handler
export async function veoOperation(req: Request) {
  try {
    const body = await req.json();
    const name = body.name as string | undefined;

    if (!name) {
      return NextResponse.json(
        { error: "Missing operation name" },
        { status: 400 }
      );
    }

    // Some SDK versions accept just the name, others expect an operation object.
    // We'll pass the minimal required shape with a name.
    const fresh = await ai.operations.getVideosOperation({
      operation: { name } as unknown as never,
    });

    return NextResponse.json(fresh);
  } catch (error) {
    console.error("Error polling operation:", error);
    return NextResponse.json(
      { error: "Failed to poll operation" },
      { status: 500 }
    );
  }
}