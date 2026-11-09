import fs from 'fs';
import path from 'path';

// Emoji regex - covers all common emoji Unicode ranges
const emojiRegex = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}\u{FE00}-\u{FE0F}]/gu;

function getFiles(dir, exts, ignore) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignore.includes(entry.name)) results = results.concat(getFiles(full, exts, ignore));
    } else if (exts.some(e => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

const files = getFiles('.', ['.html', '.js', '.css', '.ts'], ['node_modules', 'dist', '.git', '.gemini'])
  .filter(f => !f.includes('purge_emojis') && !f.includes('purge_icons') && !f.includes('check_html'));


let totalRemoved = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(emojiRegex);
  if (matches && matches.length > 0) {
    const cleaned = content.replace(emojiRegex, '');
    fs.writeFileSync(file, cleaned, 'utf8');
    console.log(`[CLEANED] ${file}: removed ${matches.length} emoji(s): ${[...new Set(matches)].join(' ')}`);
    totalRemoved += matches.length;
  }
}

if (totalRemoved === 0) {
  console.log("No emojis found.");
} else {
  console.log(`\nTotal emojis removed: ${totalRemoved}`);
}
