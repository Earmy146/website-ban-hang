import fs from 'fs';

const s = JSON.parse(fs.readFileSync('website-capture/output/interactions/acf1743d4304001f.json', 'utf8'));
const match = s.html.match(/<div id="overlay-root"[^>]*>([\s\S]*?)<\/div>\s*<div id="toast-region"/);
if (match) {
  fs.writeFileSync('src/data/search-modal.html', match[1], 'utf8');
  console.log('Search modal HTML saved!');
}

