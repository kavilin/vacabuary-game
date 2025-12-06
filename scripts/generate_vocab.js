const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load env manually since we are running this script directly
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });

const categories = [
    "Animals (Advanced)", "Fruits & Vegetables (Exotic included)", "Vehicles & Transportation",
    "Household Objects", "Nature & Weather", "Clothing & Accessories",
    "Body Parts & Health", "Professions", "Sports & Hobbies",
    "Musical Instruments", "Tools & Construction", "Electronics & Gadgets",
    "Furniture & Decor", "Space & Astronomy", "Ocean Life", "Insects & Bugs"
];

async function generateCategory(category) {
    console.log(`Generating words for: ${category}...`);
    const prompt = `
        Generate 50 distinct English vocabulary words related to "${category}".
        Target audience: Advanced toddlers / Young children (difficulty level: Medium to Hard).
        Return a JSON array named "items". Each item must have:
        - "word": The English word (e.g., "Chimpanzee", "Microscope").
        - "image_prompt": A specific description for an AI image generator to create a cute, cartoon-style illustration of the object on a white background.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const data = JSON.parse(response);
        return data.items || [];
    } catch (error) {
        console.error(`Error generating ${category}:`, error.message);
        return [];
    }
}

async function main() {
    let allItems = [];

    for (const category of categories) {
        const items = await generateCategory(category);
        // Add IDs and difficulty
        const processed = items.map((item, index) => ({
            id: `${category.split(' ')[0].toLowerCase()}-${index}`,
            word: item.word,
            image_prompt: item.image_prompt,
            category: category,
            difficulty: 'hard'
        }));
        allItems = [...allItems, ...processed];
        console.log(`Added ${processed.length} items. Total: ${allItems.length}`);
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const outputPath = path.join(__dirname, '../data/vocabulary.json');
    fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
    console.log(`Successfully saved ${allItems.length} words to ${outputPath}`);
}

main();
