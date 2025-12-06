import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const difficulty = searchParams.get('difficulty') || 'easy';

        // Read from local vocabulary file
        const filePath = path.join(process.cwd(), 'data', 'vocabulary.json');
        let items = [];

        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            items = JSON.parse(fileContent);

            // Filter by difficulty
            // If difficulty is 'easy', only show easy.
            // If 'medium', show easy + medium.
            // If 'hard', show all (or just hard/medium).
            // Let's be strict:
            if (difficulty === 'easy') {
                items = items.filter(i => i.difficulty === 'easy');
            } else if (difficulty === 'medium') {
                items = items.filter(i => i.difficulty === 'medium');
            } else {
                items = items.filter(i => i.difficulty === 'hard');
            }

            // STRICT REQUIREMENT: Only show items with local images
            items = items.filter(i => i.local_image_path);

            // Fallback if not enough items in category (try to find ANY local items)
            if (items.length < 4) {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const allItems = JSON.parse(fileContent);
                // Fallback: use any local items regardless of difficulty
                items = allItems.filter(i => i.local_image_path);
            }
        } else {
            // Fallback if file doesn't exist
            items = [
                { id: 'fallback-1', word: 'Apple', image_prompt: 'A red apple' },
                { id: 'fallback-2', word: 'Car', image_prompt: 'A blue car' },
                { id: 'fallback-3', word: 'Cat', image_prompt: 'A cute cat' },
                { id: 'fallback-4', word: 'Dog', image_prompt: 'A happy dog' }
            ];
        }

        // Select 4 random items
        const selectedItems = items
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);

        // Add image URLs (prefer local, fallback to Pollinations)
        const gameItems = selectedItems.map(item => ({
            ...item,
            imageUrl: item.local_image_path || `https://image.pollinations.ai/prompt/${encodeURIComponent(item.image_prompt + " disney-style realistic 3d rendering, white background")}?width=400&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`
        }));

        return NextResponse.json({ items: gameItems });
    } catch (error) {
        console.error("Error generating game content:", error);
        return NextResponse.json({ error: "Failed to generate game data" }, { status: 500 });
    }
}
