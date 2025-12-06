const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: { responseMimeType: "application/json" } });

const vocabularyPath = path.join(__dirname, '../data/vocabulary.json');
const vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));

async function classifyChunk(items) {
    const words = items.map(i => i.word).join(", ");
    const prompt = `
        Classify the following words into three difficulty levels for a child's vocabulary game:
        1. "easy": Very common words understood by a 3-year-old (e.g., Cat, Dog, Apple, Car).
        2. "medium": Common words for 4-5 year olds.
        3. "hard": Advanced or less common words.

        Words: ${words}

        Return a JSON object where keys are the words and values are the difficulty ("easy", "medium", "hard").
        Example: { "Cat": "easy", "Tractor": "medium", "Photosynthesis": "hard" }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        return JSON.parse(response);
    } catch (error) {
        console.error("Error classifying chunk:", error.message);
        return {};
    }
}

async function main() {
    console.log(`Classifying ${vocabulary.length} items...`);

    const CHUNK_SIZE = 50;
    let updatedVocabulary = [...vocabulary];

    for (let i = 0; i < vocabulary.length; i += CHUNK_SIZE) {
        const chunk = vocabulary.slice(i, i + CHUNK_SIZE);
        console.log(`Processing chunk ${i} - ${i + CHUNK_SIZE}...`);

        const classifications = await classifyChunk(chunk);

        // Update items in the main array
        for (let j = 0; j < chunk.length; j++) {
            const item = chunk[j];
            let difficulty = classifications[item.word] || 'medium'; // Default to medium if missing

            // Enforce max length of 5 for 'easy' words
            if (difficulty === 'easy' && item.word.length > 5) {
                difficulty = 'medium';
            }

            // Find index in main array (using ID to be safe)
            const index = updatedVocabulary.findIndex(v => v.id === item.id);
            if (index !== -1) {
                updatedVocabulary[index].difficulty = difficulty;
            }
        }

        // Save progress periodically
        fs.writeFileSync(vocabularyPath, JSON.stringify(updatedVocabulary, null, 2));

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("Classification complete!");
}

main();
