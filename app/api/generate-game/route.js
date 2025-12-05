import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
      You are a content generator for a toddler's educational game.
      Generate 4 distinct, simple, and recognizable objects (e.g., animals, fruits, vehicles).
      Return a JSON array named "items". Each item should have:
      - "id": A unique string ID (e.g., "item-1").
      - "word": The Traditional Chinese name of the object (e.g., "蘋果").
      - "english_word": The English name (e.g., "Apple").
      - "image_prompt": A specific, simple description for an AI image generator to create a cute, cartoon-style illustration of the object on a white background.
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        // Ensure we have the items array
        const rawItems = data.items || data;

        // Add image URLs using Pollinations.ai (free, fast, no auth needed)
        const items = rawItems.map(item => ({
            ...item,
            // seed helps keep it consistent if we re-render, but random is fine too. 
            // We add 'cartoon, vector, white background' to ensure style consistency.
            imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(item.image_prompt + " cute cartoon vector art, white background")}?width=400&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`
        }));

        return NextResponse.json({ items });
    } catch (error) {
        console.error("Error generating game content:", error);
        return NextResponse.json({ error: "Failed to generate game data" }, { status: 500 });
    }
}
