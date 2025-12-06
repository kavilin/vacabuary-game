const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Load env
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

const vocabPath = path.join(__dirname, '../data/vocabulary.json');
const mdPath = path.join(__dirname, '../difficulty_levels.md');

async function getPromptsForChunk(words) {
    const prompt = `
        Generate a "Disney-style, realistic 3d rendering" image prompt for EACH of the following words.
        Words: ${JSON.stringify(words)}
        
        Return a JSON object where keys are the words and values are the image prompts.
        Example: { "Apple": "A delicious, shiny red apple...", "Car": "A cute blue car..." }
        
        The prompts should be descriptive, cute, and suitable for a children's game. 
        Focus on the object itself on a white background.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        return JSON.parse(response);
    } catch (error) {
        console.error("Error generating prompts:", error.message);
        return {};
    }
}

async function main() {
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    const existingVocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

    const lines = mdContent.split('\n');
    let currentDifficulty = 'medium';
    let newWords = [];

    // Parse MD
    for (const line of lines) {
        if (line.startsWith('## Easy')) currentDifficulty = 'easy';
        else if (line.startsWith('## Medium')) currentDifficulty = 'medium';
        else if (line.startsWith('## Hard')) currentDifficulty = 'hard';
        else if (line.trim().length > 0 && !line.startsWith('#')) {
            // Assume comma separated list
            const words = line.split(',').map(w => w.trim()).filter(w => w.length > 0);
            words.forEach(word => {
                newWords.push({ word, difficulty: currentDifficulty });
            });
        }
    }

    console.log(`Found ${newWords.length} words in MD.`);

    let finalVocab = [];
    const CHUNK_SIZE = 20;

    for (let i = 0; i < newWords.length; i += CHUNK_SIZE) {
        const chunk = newWords.slice(i, i + CHUNK_SIZE);
        const chunkWords = chunk.map(i => i.word);

        console.log(`Processing chunk ${i} - ${i + CHUNK_SIZE}...`);

        // Generate new prompts for EVERYTHING to ensure consistency and "Disney style"
        const prompts = await getPromptsForChunk(chunkWords);

        chunk.forEach(nw => {
            const existing = existingVocab.find(ev => ev.word.toLowerCase() === nw.word.toLowerCase());

            // Generate stable ID if new
            const id = existing ? existing.id : `word-${Math.random().toString(36).substr(2, 9)}`;

            finalVocab.push({
                id: id,
                word: nw.word,
                image_prompt: prompts[nw.word] || (existing ? existing.image_prompt : `A cute ${nw.word} on a white background`),
                difficulty: nw.difficulty,
                category: existing ? existing.category : 'General', // Preserve category or default
                // local_image_path: undefined // Explicitly removed to force re-download
            });
        });

        // Save incrementally
        fs.writeFileSync(vocabPath, JSON.stringify(finalVocab, null, 2)); // Warning: this overwrites incrementally, but we are building finalVocab from scratch so at the end it's correct. 
        // Actually, better to append or just write at the end. But for safety if script crashes, maybe invalid.
        // Let's just wait to write at the end for safety.

        await new Promise(r => setTimeout(r, 1000));
    }

    fs.writeFileSync(vocabPath, JSON.stringify(finalVocab, null, 2));
    console.log("Done! Vocabulary synced.");
}

main();
