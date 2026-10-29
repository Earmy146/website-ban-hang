import fs from 'fs';

const d = JSON.parse(fs.readFileSync('website-capture/output/routes/68865d0ef7c4ac7b3545.json', 'utf8'));
const navMatch = d.html.match(/<nav class="navigation">([\s\S]*?)<\/nav>/);
if (navMatch) {
  fs.writeFileSync('src/data/navigation.html', navMatch[1], 'utf8');
  console.log('Nav extracted successfully!');
}

