const fs = require('fs');
const path = require('path');

const vocabularyPath = path.join(__dirname, '../data/vocabulary.json');
const vocabulary = JSON.parse(fs.readFileSync(vocabularyPath, 'utf8'));

const levels = {
    easy: [],
    medium: [],
    hard: []
};

const violations = [];

vocabulary.forEach(item => {
    const diff = item.difficulty || 'medium';
    if (levels[diff]) {
        levels[diff].push(item.word);
    }

    if (diff === 'easy' && item.word.length > 5) {
        violations.push(`${item.word} (${item.word.length})`);
    }
});

let mdContent = '# Vocabulary Difficulty Levels\n\n';

mdContent += `## Easy (<= 5 letters)\n`;
mdContent += levels.easy.join(', ') + '\n\n';

mdContent += `## Medium\n`;
mdContent += levels.medium.join(', ') + '\n\n';

mdContent += `## Hard (Expert)\n`;
mdContent += levels.hard.join(', ') + '\n\n';

if (violations.length > 0) {
    console.log("Violations found:", violations);
    mdContent += `\n\n> [!WARNING]\n> Found ${violations.length} words marked 'easy' but > 5 letters: ${violations.join(', ')}`;
} else {
    console.log("No violations found. All easy words are <= 5 letters.");
}

fs.writeFileSync(path.join(__dirname, '../difficulty_levels.md'), mdContent);
console.log("Report generated at difficulty_levels.md");
