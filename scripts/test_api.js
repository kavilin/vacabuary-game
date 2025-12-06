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

async function listModels() {
    try {
        // There isn't a direct listModels on genAI instance in the simplified SDK, 
        // but we can try to just run a generation on a model we think exists to see the error,
        // or use the model manager if available.
        // Actually, the error message suggested calling ListModels.
        // The Node SDK doesn't expose ListModels directly on the top level class easily in all versions.
        // Let's try a simple generation with 'gemini-1.5-flash' again and print full error.

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
