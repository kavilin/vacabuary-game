const fs = require('fs');
const path = require('path');

const vocabularyPath = path.join(__dirname, '../data/vocabulary.json');
const imagesDir = path.join(__dirname, '../public/images');

if (!fs.existsSync(vocabularyPath)) {
    console.error("vocabulary.json not found");
    process.exit(1);
}

const vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));
let updatedCount = 0;

const updatedVocabulary = vocabulary.map(item => {
    const filename = `${item.id}.jpg`;
    const localPath = path.join(imagesDir, filename);
    const publicPath = `/images/${filename}`;

    if (fs.existsSync(localPath)) {
        const stats = fs.statSync(localPath);
        if (stats.size > 0) {
            updatedCount++;
            return {
                ...item,
                local_image_path: publicPath
            };
        }
    }
    // If file doesn't exist or is empty, remove local_image_path if it exists
    const { local_image_path, ...rest } = item;
    return rest;
});

fs.writeFileSync(vocabularyPath, JSON.stringify(updatedVocabulary, null, 2));
console.log(`Updated ${updatedCount} items with local image paths.`);
