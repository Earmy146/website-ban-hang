import fs from 'fs';

const navHtml = fs.readFileSync('src/data/navigation.html', 'utf8');

const sectionRegex = /<section class="nav-group"[^>]*aria-label="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
const sections = [];

let sMatch;
while ((sMatch = sectionRegex.exec(navHtml)) !== null) {
  const groupTitle = sMatch[1].replace(/&amp;/g, '&');
  const groupHtml = sMatch[2];
  const items = [];

  // Tìm link trực tiếp (như Overview)
  const directLinkRegex = /<a class="nav-link(?:\s+[^"]*)?" href="([^"]+)" title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let dlMatch;
  while ((dlMatch = directLinkRegex.exec(groupHtml)) !== null) {
    if (!dlMatch[0].includes('nav-child')) {
      const iconMatch = dlMatch[3].match(/<svg[\s\S]*?<\/svg>/);
      items.push({
        type: 'link',
        path: dlMatch[1],
        title: dlMatch[2].replace(/&amp;/g, '&'),
        iconSvg: iconMatch ? iconMatch[0] : ''
      });
    }
  }

  // Tìm các button nav-parent
  // Thuộc tính có thể theo bất kỳ thứ tự nào: aria-controls="...", title="..."
  const btnRegex = /<button[^>]*class="nav-link nav-parent"[^>]*>([\s\S]*?)<\/button>/g;
  let bMatch;
  while ((bMatch = btnRegex.exec(groupHtml)) !== null) {
    const fullTag = bMatch[0];
    const inner = bMatch[1];
    
    const titleMatch = fullTag.match(/title="([^"]+)"/);
    const controlsMatch = fullTag.match(/aria-controls="([^"]+)"/);
    const iconMatch = inner.match(/<svg[\s\S]*?<\/svg>/);
    
    const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&') : '';
    const id = controlsMatch ? controlsMatch[1] : '';
    const iconSvg = iconMatch ? iconMatch[0] : '';
    
    // Tìm ul tương ứng: <ul class="nav-children" id="ID"...>...</ul>
    const ulRegex = new RegExp(`<ul class="nav-children"[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/ul>`);
    const ulMatch = groupHtml.match(ulRegex);
    const children = [];
    
    if (ulMatch) {
      const childRegex = /<a class="nav-link nav-child" href="([^"]+)"[^>]*><span>([^<]+)<\/span><\/a>/g;
      let cMatch;
      while ((cMatch = childRegex.exec(ulMatch[1])) !== null) {
        children.push({
          path: cMatch[1],
          title: cMatch[2].replace(/&amp;/g, '&')
        });
      }
    }
    
    items.push({
      type: 'group',
      id,
      title,
      iconSvg,
      children
    });
  }

  sections.push({
    groupTitle,
    items
  });
}

fs.writeFileSync('src/data/navigation.json', JSON.stringify(sections, null, 2), 'utf8');
console.log('Navigation groups summary:');
for (const s of sections) {
  console.log(`- ${s.groupTitle}: ${s.items.length} items`);
  s.items.forEach(it => {
    if (it.type === 'link') console.log(`   * [Link] ${it.title} (${it.path})`);
    else console.log(`   * [Group] ${it.title} (${it.children.length} sub-pages)`);
  });
}
