import fs from 'fs';
import path from 'path';

const manifest = JSON.parse(fs.readFileSync('website-capture/output/manifest.json', 'utf8'));

const pages = {};

for (const route of manifest.routes) {
  const urlPath = route.url.replace('https://veylix-black.vercel.app', '');
  const snapshotFile = path.join('website-capture/output', route.snapshot);
  
  if (fs.existsSync(snapshotFile)) {
    const data = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
    const html = data.html || '';
    const mainMatch = html.match(/<main id="main-content"[^>]*>([\s\S]*?)<\/main>/);
    const mainHtml = mainMatch ? mainMatch[1] : '';
    
    pages[urlPath] = {
      path: urlPath,
      title: route.title,
      mainHtml: mainHtml.trim(),
    };
  }
}

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/pages-content.json', JSON.stringify(pages, null, 2), 'utf8');

console.log('Successfully extracted', Object.keys(pages).length, 'pages!');

