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
const vocabulary = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

async function enhancePromptsForChunk(words) {
    const prompt = `
        For each of the following words, create a HIGHLY DETAILED, SPECIFIC image prompt for a Disney-style realistic 3D rendering.
        
        Words: ${JSON.stringify(words)}
        
        Requirements:
        - Be VERY SPECIFIC about the object's appearance, colors, textures, and distinctive features
        - Clearly describe what makes this object recognizable and unique
        - Include relevant context or typical use case if it helps clarity
        - Use vivid, descriptive language
        - Always end with "on a clean white background, Disney-style realistic 3D rendering"
        - Make it clear enough that a child could identify the word from the image
        
        Example for "Apple": "A shiny, bright red apple with a small brown stem and a single green leaf attached, showing realistic texture with subtle highlights and a small white reflection spot, on a clean white background, Disney-style realistic 3D rendering"
        
        Return a JSON object where keys are the words and values are the enhanced image prompts.
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
    console.log(`Enhancing prompts for ${vocabulary.length} words...`);

    const CHUNK_SIZE = 20;
    let updatedVocab = [...vocabulary];

    for (let i = 0; i < vocabulary.length; i += CHUNK_SIZE) {
        const chunk = vocabulary.slice(i, i + CHUNK_SIZE);
        const chunkWords = chunk.map(item => item.word);

        console.log(`Processing chunk ${i} - ${i + CHUNK_SIZE}...`);

        const enhancedPrompts = await enhancePromptsForChunk(chunkWords);

        chunk.forEach((item, idx) => {
            const globalIdx = i + idx;
            if (enhancedPrompts[item.word]) {
                updatedVocab[globalIdx].image_prompt = enhancedPrompts[item.word];
            }
        });

        // Save progress incrementally
        fs.writeFileSync(vocabPath, JSON.stringify(updatedVocab, null, 2));

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("Done! All prompts enhanced.");
}

main();
