import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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
    console.log(
      "Image file details:",
      imageFiles.map((f, i) => ({
        index: i,
        name: f instanceof File ? f.name : "not-file",
        type: f instanceof File ? f.type : typeof f,
      }))
    );

    const contents: (
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    )[] = [];

    // Add the prompt as text
    contents.push({ text: prompt });

    // Process each image file
    console.log("Processing image files...");
    for (const imageFile of imageFiles) {
      if (imageFile && imageFile instanceof File) {
        console.log(
          `Processing file: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`
        );
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
    console.log("Total contents after processing:", contents.length);

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

    // First, analyze the uploaded image to understand what product it is
    console.log("🔍 Analyzing uploaded image to determine product type...");
    
    let productType = "product"; // default fallback
    
    try {
      // Use Gemini to analyze the image and determine what product it is
      console.log("🔍 Sending image to Gemini for analysis...");
      const analysisResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Look at this image and tell me what type of product this is. Respond with just one word: shoes, phone, watch, bag, laptop, or other. Be very specific about the product category.",
              },
              {
                inlineData: {
                  mimeType: contents[1].inlineData?.mimeType || "image/png",
                  data: contents[1].inlineData?.data || "",
                },
              },
            ],
          },
        ],
      });
      
      const detectedProduct = analysisResponse.candidates[0].content.parts[0].text.toLowerCase().trim();
      console.log("🎯 Raw Gemini response:", detectedProduct);
      
      // Map detected product to appropriate category
      if (detectedProduct.includes('shoe') || detectedProduct.includes('sneaker') || detectedProduct.includes('footwear') || detectedProduct.includes('boot')) {
        productType = "shoes";
      } else if (detectedProduct.includes('phone') || detectedProduct.includes('smartphone') || detectedProduct.includes('mobile')) {
        productType = "phone";
      } else if (detectedProduct.includes('watch') || detectedProduct.includes('timepiece')) {
        productType = "watch";
      } else if (detectedProduct.includes('bag') || detectedProduct.includes('handbag') || detectedProduct.includes('purse')) {
        productType = "bag";
      } else if (detectedProduct.includes('laptop') || detectedProduct.includes('computer') || detectedProduct.includes('notebook')) {
        productType = "laptop";
      } else {
        productType = "product";
      }
      
      console.log("✅ Mapped to product type:", productType);
      
    } catch (error) {
      console.log("⚠️ Could not analyze image, using default product type");
      console.log("🔍 Analysis error:", error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Create product-specific safe prompts
    const productSpecificPrompts = {
      shoes: [
        "Create a professional athletic shoe advertisement with modern design and clean background",
        "Generate a high-quality sneaker marketing image with studio lighting and professional composition",
        "Design a commercial footwear product photograph suitable for e-commerce and retail",
        "Create a professional running shoe advertisement with dynamic lighting and modern aesthetic",
        "Generate a high-quality athletic footwear marketing image with clean studio background"
      ],
      phone: [
        "Create a professional smartphone advertisement with modern design and clean background",
        "Generate a high-quality mobile phone marketing image with studio lighting and professional composition",
        "Design a commercial smartphone product photograph suitable for e-commerce and retail",
        "Create a professional mobile device advertisement with sleek lighting and modern aesthetic",
        "Generate a high-quality phone marketing image with clean studio background"
      ],
      watch: [
        "Create a professional wristwatch advertisement with elegant design and clean background",
        "Generate a high-quality timepiece marketing image with studio lighting and professional composition",
        "Design a commercial watch product photograph suitable for e-commerce and retail",
        "Create a professional luxury watch advertisement with sophisticated lighting and modern aesthetic",
        "Generate a high-quality watch marketing image with clean studio background"
      ],
      bag: [
        "Create a professional handbag advertisement with elegant design and clean background",
        "Generate a high-quality bag marketing image with studio lighting and professional composition",
        "Design a commercial handbag product photograph suitable for e-commerce and retail",
        "Create a professional luxury bag advertisement with sophisticated lighting and modern aesthetic",
        "Generate a high-quality bag marketing image with clean studio background"
      ],
      laptop: [
        "Create a professional laptop advertisement with modern design and clean background",
        "Generate a high-quality computer marketing image with studio lighting and professional composition",
        "Design a commercial laptop product photograph suitable for e-commerce and retail",
        "Create a professional notebook advertisement with sleek lighting and modern aesthetic",
        "Generate a high-quality laptop marketing image with clean studio background"
      ],
      product: [
        "Create a professional product advertisement with modern design and clean background",
        "Generate a high-quality product marketing image with studio lighting and professional composition",
        "Design a commercial product photograph suitable for e-commerce and retail",
        "Create a professional product advertisement with sleek lighting and modern aesthetic",
        "Generate a high-quality product marketing image with clean studio background"
      ]
    };
    
    const safePrompts = productSpecificPrompts[productType as keyof typeof productSpecificPrompts] || productSpecificPrompts.product;
    
    console.log("Original prompt:", prompt);
    console.log("Detected product type:", productType);
    console.log("Using product-specific safe prompts for:", productType);

    // Try multiple safe prompts if the first one fails
    let image = null;
    let lastError = null;
    
    for (let i = 0; i < safePrompts.length; i++) {
      try {
        console.log(`🔄 Trying safe prompt ${i + 1}/${safePrompts.length}: ${safePrompts[i]}`);
        
        const resp = await ai.models.generateImages({
          model: "imagen-4.0-fast-generate-001",
          prompt: safePrompts[i],
          config: {
            aspectRatio: "16:9",
          },
        });

        image = resp.generatedImages?.[0]?.image;
        if (image?.imageBytes) {
          console.log(`✅ Successfully generated image with prompt ${i + 1}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Prompt ${i + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
        lastError = error;
        continue;
      }
    }

    if (!image?.imageBytes) {
      console.log("❌ All safe prompts failed");
      return NextResponse.json({ 
        error: "Unable to generate image with any safe prompts. This may be due to content filtering restrictions.",
        details: "Please try again or contact support if this persists."
      }, { status: 500 });
    }

    return NextResponse.json({
      image: {
        imageBytes: image.imageBytes,
        mimeType: image.mimeType || "image/png",
      },
    });
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    
    // Check if it's a Responsible AI violation
    if (error instanceof Error && error.message.includes("Responsible AI practices")) {
      console.log("🚫 Image generation blocked by Responsible AI - trying with safer prompt");
      return NextResponse.json(
        { 
          error: "Image generation was blocked by content filters. Please try a different prompt that's more appropriate for professional use.",
          details: "The prompt may contain content that violates Google's Responsible AI guidelines. Try rephrasing to be more professional and appropriate."
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to edit image" },
      { status: 500 }
    );
  }
}
