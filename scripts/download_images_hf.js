const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const path = require('path');

const vocabularyPath = path.join(__dirname, '../data/vocabulary.json');
const imagesDir = path.join(__dirname, '../public/images');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Load HF token from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const hfTokenMatch = envContent.match(/HF_TOKEN=(.*)/);
const HF_TOKEN = hfTokenMatch ? hfTokenMatch[1].trim() : null;

if (!HF_TOKEN) {
    console.error("❌ HF_TOKEN not found in .env.local");
    process.exit(1);
}

const hf = new HfInference(HF_TOKEN);
const vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));

async function generateImage(prompt) {
    try {
        const blob = await hf.textToImage({
            model: "black-forest-labs/FLUX.1-schnell",
            inputs: prompt,
            parameters: {
                width: 512,
                height: 512,
                num_inference_steps: 4
            }
        });

        const arrayBuffer = await blob.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        throw new Error(`HF API: ${error.message}`);
    }
}

async function main() {
    console.log(`🎨 Found ${vocabulary.length} items. Starting Hugging Face download...\n`);

    let updatedVocabulary = [...vocabulary];
    let successCount = 0;
    let errorCount = 0;

    const CHUNK_SIZE = 3;

    for (let i = 0; i < vocabulary.length; i += CHUNK_SIZE) {
        const chunk = vocabulary.slice(i, i + CHUNK_SIZE);

        for (let j = 0; j < chunk.length; j++) {
            const item = chunk[j];
            const globalIdx = i + j;
            const filename = `${item.id}-disney-style.jpg`;
            const filepath = path.join(imagesDir, filename);
            const localPath = `/images/${filename}`;

            // Skip if already downloaded
            if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
                process.stdout.write('s');
                updatedVocabulary[globalIdx] = {
                    ...item,
                    local_image_path: localPath,
                    downloaded: true
                };
                successCount++;
                continue;
            }

            try {
                const imageBuffer = await generateImage(item.image_prompt);
                fs.writeFileSync(filepath, imageBuffer);

                updatedVocabulary[globalIdx] = {
                    ...item,
                    local_image_path: localPath,
                    downloaded: true
                };

                process.stdout.write('✓');
                successCount++;

            } catch (err) {
                console.error(`\n❌ ${item.word}: ${err.message}`);
                updatedVocabulary[globalIdx] = {
                    ...item,
                    downloaded: false
                };
                errorCount++;
            }

            // Save progress after each image
            fs.writeFileSync(vocabularyPath, JSON.stringify(updatedVocabulary, null, 2));

            // Delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        if ((i + CHUNK_SIZE) % 30 === 0) {
            console.log(`\n📊 Progress: ${i + CHUNK_SIZE}/${vocabulary.length} | ✓ ${successCount} | ❌ ${errorCount}`);
        }
    }

    console.log(`\n\n✅ Done! Successfully generated ${successCount}/${vocabulary.length} images.`);
    if (errorCount > 0) {
        console.log(`⚠️  ${errorCount} images failed. You can re-run to retry.`);
    }
}

main();
