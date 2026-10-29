import { chromium } from 'playwright';
import fs from 'fs';

const missingRoutes = [
  '/commerce/report-payments',
  '/commerce/report-vendors',
  '/commerce/report-marketing',
  '/commerce/chat',
  '/commerce/tickets',
  '/commerce/email',
  '/commerce/email-templates',
  '/commerce/notifications',
  '/commerce/ai-workflows',
  '/commerce/ai-studio',
  '/commerce/ai-voice',
  '/commerce/knowledge',
  '/commerce/prompts',
  '/commerce/automations',
  '/commerce/ai-history',
  '/commerce/media',
  '/commerce/files',
  '/commerce/users',
  '/commerce/roles',
  '/commerce/permissions',
  '/commerce/teams',
  '/commerce/audit',
  '/commerce/integrations',
  '/commerce/webhooks',
  '/commerce/settings-general',
  '/commerce/settings-branding',
  '/commerce/settings-localization',
  '/commerce/settings-seo',
  '/commerce/settings-maintenance',
  '/commerce/settings-marketing',
  '/commerce/taxes',
  '/commerce/shipping-rules',
  '/commerce/settings-notifications',
  '/commerce/settings-email',
  '/commerce/settings-storage',
  '/commerce/settings-security'
];

async function crawlMissing() {
  console.log(`Starting crawler for ${missingRoutes.length} missing routes...`);
  
  const pages = JSON.parse(fs.readFileSync('src/data/pages-content.json', 'utf8'));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1720, height: 1000 }
  });

  const page = await context.newPage();

  let successCount = 0;

  for (let i = 0; i < missingRoutes.length; i++) {
    const route = missingRoutes[i];
    const url = `https://veylix-black.vercel.app${route}`;
    console.log(`[${i + 1}/${missingRoutes.length}] Fetching: ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000); // Đợi client-side SPA render

      const data = await page.evaluate(() => {
        const main = document.querySelector('#main-content');
        return {
          title: document.title,
          mainHtml: main ? main.innerHTML : ''
        };
      });

      if (data.mainHtml) {
        pages[route] = {
          path: route,
          title: data.title,
          mainHtml: data.mainHtml
        };
        successCount++;
        console.log(`   ✓ Saved: ${data.title} (${data.mainHtml.length} chars)`);
      } else {
        console.log(`   ✗ No #main-content found on ${route}`);
      }
    } catch (err) {
      console.error(`   ✗ Error on ${route}:`, err.message);
    }
  }

  await browser.close();

  fs.writeFileSync('src/data/pages-content.json', JSON.stringify(pages, null, 2), 'utf8');
  console.log(`\nDone! Successfully crawled and added ${successCount} routes. Total pages in store: ${Object.keys(pages).length}`);
}

crawlMissing();
