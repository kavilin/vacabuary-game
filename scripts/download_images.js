const fs = require('fs');
const path = require('path');
const https = require('https');

const vocabularyPath = path.join(__dirname, '../data/vocabulary.json');
const imagesDir = path.join(__dirname, '../public/images');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(filepath, () => { }); // Delete the empty file
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { }); // Delete the file async. (But we don't check the result)
            reject(err);
        });
    });
};

async function main() {
    console.log(`Found ${vocabulary.length} items. Starting download...`);

    let updatedVocabulary = [...vocabulary]; // Start with full vocabulary
    let count = 0;

    // Process in chunks to avoid overwhelming the server or local network
    const CHUNK_SIZE = 5;

    for (let i = 0; i < vocabulary.length; i += CHUNK_SIZE) {
        const chunk = vocabulary.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(async (item) => {
            const filename = `${item.id}-disney-style.jpg`;
            const filepath = path.join(imagesDir, filename);
            const localPath = `/images/${filename}`;

            // Construct Pollinations URL
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(item.image_prompt + " disney-style realistic 3d rendering, white background")}?width=400&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

            let downloaded = false;

            if (!fs.existsSync(filepath)) {
                try {
                    await downloadImage(imageUrl, filepath);
                    downloaded = true;
                    process.stdout.write('.');
                } catch (err) {
                    console.error(`\nError downloading ${item.word}:`, err.message);
                }
            } else {
                downloaded = true; // Already exists
                process.stdout.write('s'); // s for skipped
            }

            return {
                ...item,
                local_image_path: localPath,
                downloaded: downloaded
            };
        });

        const results = await Promise.all(promises);

        // Update the corresponding items in updatedVocabulary
        results.forEach((result, idx) => {
            const globalIdx = i + idx;
            updatedVocabulary[globalIdx] = result;
        });

        // Save progress incrementally every chunk
        fs.writeFileSync(vocabularyPath, JSON.stringify(updatedVocabulary, null, 2));

        count += results.length;
        if (count % 50 === 0) console.log(`\nProcessed ${count}/${vocabulary.length}`);

        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Save updated vocabulary with local paths
    fs.writeFileSync(vocabularyPath, JSON.stringify(updatedVocabulary, null, 2));
    console.log(`\nDone! Updated vocabulary.json with local paths.`);
}

main();
