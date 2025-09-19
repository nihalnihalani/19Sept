import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("imageFile") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageFile.type;

    // Create the prompt for category detection
    const categoryPrompt = `
    Analyze this product image and identify the product category. 
    Return ONLY the category name from the following list:
    
    - shoes (sneakers, boots, sandals, heels, etc.)
    - beauty (skincare, makeup, cosmetics, etc.)
    - beverage (soda, juice, water, energy drinks, etc.)
    - clothing (shirts, pants, dresses, jackets, etc.)
    - electronics (phones, laptops, headphones, etc.)
    - home (furniture, decor, appliances, etc.)
    - food (snacks, packaged food, etc.)
    - accessories (bags, jewelry, watches, etc.)
    - sports (equipment, gear, etc.)
    - automotive (car parts, accessories, etc.)
    - other (if none of the above categories fit)
    
    Be specific and choose the most appropriate category. If the product could fit multiple categories, choose the primary one.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: [
        {
          parts: [
            {
              text: categoryPrompt
            },
            {
              inlineData: {
                data: base64,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    });

    const category = response.candidates[0].content.parts[0].text?.trim().toLowerCase();

    // Validate category
    const validCategories = [
      'shoes', 'beauty', 'beverage', 'clothing', 'electronics', 
      'home', 'food', 'accessories', 'sports', 'automotive', 'other'
    ];

    const detectedCategory = validCategories.includes(category) ? category : 'other';

    return NextResponse.json({
      category: detectedCategory,
      confidence: "high" // You could implement confidence scoring later
    });

  } catch (error) {
    console.error("Error detecting product category:", error);
    return NextResponse.json(
      { error: "Failed to detect product category" },
      { status: 500 }
    );
  }
}
