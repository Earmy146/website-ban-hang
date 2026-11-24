/**
 * Kịch bản kiểm thử tích hợp đầu-cuối V3 (Storefront Sang trọng Cá nhân hóa + Toàn bộ Admin + MongoDB)
 * Sở hữu bởi: @verifier
 * Cách chạy:
 *   node scripts/verify-integration.mjs              (chạy trọn bộ API V1/V2/V3 + Playwright Desktop & Mobile)
 *   node scripts/verify-integration.mjs --api-only   (chỉ chạy kiểm thử REST API V1/V2/V3)
 *   node scripts/verify-integration.mjs --ui-only    (chỉ chạy kiểm thử Playwright Desktop & Mobile)
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const FE_BASE = process.env.FE_BASE || 'http://localhost:3000';
const SCREENSHOT_DIR =
  process.env.SCREENSHOT_DIR ||
  'C:/Users/Earmy/.gemini/antigravity/brain/3ec24443-2440-4eb6-889c-069cb7d85004';

const args = new Set(process.argv.slice(2));
const runApi = !args.has('--ui-only');
const runUi = !args.has('--api-only');

const VALID_PRODUCT_IMAGES = new Set([
  'everyday-tee.png',
  'minimal-backpack.png',
  'ceramic-mug.png',
  'canvas-tote-bag.png',
  'wireless-mouse.png',
  'water-bottle.png',
  'notebook-set.png',
  'linen-overshirt.png',
  'cotton-throw.png',
  'travel-pouch.png',
  'desk-organizer.png',
  'stoneware-bowl.png',
]);

const results = {
  passed: [],
  failed: [],
};

function pass(name, detail = '') {
  results.passed.push({ name, detail });
  console.log(`  ✅ PASS: ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, error) {
  const msg = error instanceof Error ? error.message : String(error);
  results.failed.push({ name, error: msg });
  console.error(`  ❌ FAIL: ${name} — ${msg}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, ok: res.ok, json };
}

async function step(name, fn) {
  try {
    const detail = await fn();
    pass(name, detail || '');
    return true;
  } catch (err) {
    fail(name, err);
    return false;
  }
}

// ============================================================================
// PHẦN 1: KIỂM THỬ REST API V1 + V2 + V3 & LIÊN THÔNG DỮ LIỆU
// ============================================================================
async function runApiSuite() {
  console.log('\n==================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ REST API V1 + V2 + V3 & LIÊN THÔNG (PORT 5000)');
  console.log('==================================================================');

  const uniqueSuffix = Date.now().toString().slice(-5);

  await step('API-01. Health, Topbar Summary, Notifications & Quick Search', async () => {
    const h = await apiFetch('/health');
    assert(h.status === 200 && h.json?.data?.db?.connected === true, 'Health DB lỗi');

    const sum = await apiFetch('/topbar/summary');
    assert(sum.status === 200 && typeof sum.json?.data?.ordersCount === 'number', 'Topbar summary lỗi');

    const notif = await apiFetch('/notifications');
    assert(notif.status === 200 && notif.json?.data?.length > 0, 'Notifications trống');

    const srch = await apiFetch('/search?q=VX');
    assert(srch.status === 200 && srch.json?.data?.length > 0, 'Search q=VX trống');
    return `mode=${h.json.data.db.mode}, orders=${sum.json.data.ordersCount}`;
  });

  await step('API-02. Overview & 10 loại Báo cáo chuyên sâu (/api/reports)', async () => {
    const ov = await apiFetch('/overview?period=30&chartRange=30');
    assert(ov.status === 200 && ov.json?.data?.gmvCard, 'Overview lỗi');

    const types = ['sales', 'orders', 'products', 'inventory', 'customers', 'returns', 'channels', 'payments', 'vendors', 'marketing'];
    for (const t of types) {
      const r = await apiFetch(`/reports?range=30&type=${t}`);
      assert(r.status === 200 && Array.isArray(r.json?.data?.breakdownRows), `Report ${t} lỗi`);
    }
    return `Overview + ${types.length} loại báo cáo OK`;
  });

  await step('API-03. Products, Stock sync, Validation 400/409 & includeDeleted', async () => {
    const list = await apiFetch('/products');
    assert(list.status === 200 && list.json?.data?.length >= 8, 'Danh sách SP quá ít');
    for (const p of list.json.data) {
      if (p.image?.startsWith('/assets/images/products/')) {
        const basename = p.image.split('/').pop();
        assert(VALID_PRODUCT_IMAGES.has(basename), `Ảnh SP không tồn tại: ${p.image}`);
      }
    }

    const sku = `VX-V3-${uniqueSuffix}`;
    const cr = await apiFetch('/products', {
      method: 'POST',
      body: { name: `SP V3 ${uniqueSuffix}`, category: 'Thời trang & May mặc', sku, price: 68, inventory: 42 },
    });
    assert(cr.ok && cr.json?.data?.id, 'POST /products lỗi');
    const prodId = cr.json.data.id;

    const bad = await apiFetch('/products', { method: 'POST', body: { name: '', price: -10 } });
    assert(bad.status === 400, 'Kỳ vọng 400 khi giá âm');
    const dup = await apiFetch('/products', {
      method: 'POST',
      body: { name: 'Trùng SKU', category: 'Thời trang & May mặc', sku, price: 20, inventory: 5 },
    });
    assert(dup.status === 409, 'Kỳ vọng 409 khi trùng SKU');

    const st = await apiFetch(`/stock?search=${encodeURIComponent(sku)}`);
    assert(st.json?.data?.some((x) => x.sku === sku && x.onHand === 42), 'Product chưa đồng bộ StockItem');

    await apiFetch('/products/bulk-archive', { method: 'POST', body: { ids: [prodId] } });
    const withDel = await apiFetch('/products?includeDeleted=true');
    assert(withDel.json?.data?.some((p) => p.id === prodId && p.isDeleted === true), 'includeDeleted=true lỗi');
    return 'Products + Stock sync + 400/409 + includeDeleted OK';
  });

  await step('API-04. V3 Shipments bulk-advance + Orders + Transactions refund liên thông', async () => {
    const o1 = await apiFetch('/orders', {
      method: 'POST',
      body: { customerName: 'Sarah Kim', customerEmail: 'sarah.kim@example.com', total: 75, paymentStatus: 'Paid', fulfillmentStatus: 'Processing' },
    });
    const orderCode = o1.json.data.id;

    const sh = await apiFetch('/shipments', {
      method: 'POST',
      body: { orderId: orderCode, carrier: 'GHTK', destination: 'Quận 1, TP.HCM' },
    });
    const trkCode = sh.json.data.id;

    // V3: POST /api/shipments/bulk-advance
    const bulkAdv = await apiFetch('/shipments/bulk-advance', {
      method: 'POST',
      body: { ids: [trkCode] },
    });
    assert(bulkAdv.status === 200 && bulkAdv.json?.success === true, `POST /shipments/bulk-advance lỗi: ${JSON.stringify(bulkAdv.json)}`);
    assert(bulkAdv.json.data?.advancedCount >= 1, 'bulk-advance không tăng bước vận đơn');

    // Refund Transaction -> Order.paymentStatus = Refunded
    const txns = await apiFetch(`/transactions?search=${encodeURIComponent(orderCode)}`);
    const txn = txns.json?.data?.find((t) => t.orderId === orderCode || t.orderId === `#${orderCode}`);
    const ref = await apiFetch(`/transactions/${txn.id}/refund`, { method: 'POST' });
    assert(ref.status === 200, 'Refund lỗi');
    const ordCheck = await apiFetch(`/orders/${orderCode}`);
    assert(ordCheck.json?.data?.paymentStatus === 'Refunded', 'Refund chưa đồng bộ Order');

    await apiFetch('/orders/bulk-cancel', { method: 'POST', body: { ids: [orderCode] } });
    return `bulk-advance ${trkCode} + refund ${txn.id} OK`;
  });

  await step('API-05. V3 DELETE /api/reviews/:id & PUT /api/users/:id (status Active/Disabled + bảo vệ Owner)', async () => {
    // Tạo review tạm rồi xóa qua DELETE /api/reviews/:id
    const revCreate = await apiFetch('/store/reviews', {
      method: 'POST',
      body: { productName: 'Áo thun Everyday Tee', customerName: 'Tester Spam', rating: 2, title: 'Spam test', comment: 'Cần xóa đánh giá này' },
    });
    const revObj = revCreate.json?.data?.review || revCreate.json?.data;
    assert(revObj?.id, 'POST /store/reviews không trả id');

    const revDel = await apiFetch(`/reviews/${revObj.id}`, { method: 'DELETE' });
    assert(revDel.status === 200 && revDel.json?.success === true, `DELETE /reviews/:id lỗi HTTP ${revDel.status}`);

    // Users status Disabled/Active + chặn khóa Owner
    const users = await apiFetch('/users');
    const owner = users.json.data.find((u) => u.role === 'Chủ sở hữu (Owner)');
    const staff = users.json.data.find((u) => u.role !== 'Chủ sở hữu (Owner)');
    assert(owner && staff, 'Thiếu dữ liệu Owner / Staff');

    const lockOwner = await apiFetch(`/users/${owner.id}`, {
      method: 'PUT',
      body: { status: 'Disabled' },
    });
    assert(lockOwner.status === 400 && lockOwner.json?.success === false, `Khóa Owner phải trả 400, nhận ${lockOwner.status}`);

    const lockStaff = await apiFetch(`/users/${staff.id}`, {
      method: 'PUT',
      body: { status: 'Disabled' },
    });
    assert(lockStaff.status === 200 && lockStaff.json?.data?.status === 'Disabled', 'Tạm khóa nhân viên lỗi');

    const unlockStaff = await apiFetch(`/users/${staff.id}`, {
      method: 'PUT',
      body: { status: 'Active' },
    });
    assert(unlockStaff.status === 200 && unlockStaff.json?.data?.status === 'Active', 'Mở khóa nhân viên lỗi');
    return 'DELETE review + Lock/Unlock User + Owner guard OK';
  });

  await step('API-06. V3 Storefront Config chuẩn hóa 0% Neubrutalist (defaultUiStyle = veylix) & Checkout/Cancel', async () => {
    const home = await apiFetch('/store/home');
    const sfSettings = home.json?.data?.storefrontConfig?.settings || {};
    assert(
      sfSettings.defaultUiStyle === 'veylix',
      `defaultUiStyle kỳ vọng 'veylix', nhận '${sfSettings.defaultUiStyle}'`
    );
    assert(
      sfSettings.defaultUiStyle !== 'neobrutalist',
      'Vẫn còn giá trị neobrutalist trong /api/store/home!'
    );

    // Thử gửi giá trị cũ 'neobrutalist' vào PUT /module-configs/store -> phải tự chuẩn hóa về 'veylix'
    const putLegacy = await apiFetch('/module-configs/store', {
      method: 'PUT',
      body: { settings: { ...sfSettings, defaultUiStyle: 'neobrutalist', defaultColorTheme: 'veylix', defaultColorMode: 'light' } },
    });
    assert(
      putLegacy.status === 200 && putLegacy.json?.data?.settings?.defaultUiStyle === 'veylix',
      `Backend chưa chuẩn hóa 'neobrutalist' về 'veylix': ${JSON.stringify(putLegacy.json?.data?.settings)}`
    );

    // Checkout & Cancel hoàn lại tồn kho
    const pBefore = await apiFetch('/store/products/VX-1002');
    const inv0 = pBefore.json.data.product.inventory;
    const co = await apiFetch('/store/checkout', {
      method: 'POST',
      body: {
        customer: { name: 'Sarah Kim', email: 'sarah.kim@example.com', phone: '+84912345678', address: 'Quận 1, TP.HCM' },
        items: [{ productId: pBefore.json.data.product.id, sku: 'VX-1002', name: pBefore.json.data.product.name, price: 79, quantity: 1, variant: 'Tiêu chuẩn' }],
        shippingMethod: 'Giao hàng tiêu chuẩn',
        paymentMethod: 'COD',
        couponCode: 'HELLO10',
      },
    });
    const ordCode = co.json.data.order?.orderCode || co.json.data.order?.id;
    await apiFetch(`/store/orders/${ordCode}/cancel`, { method: 'POST' });
    const pAfter = await apiFetch('/store/products/VX-1002');
    assert(pAfter.json.data.product.inventory === inv0, 'Cancel đơn chưa hoàn kho');
    return '0% Neubrutalist (auto-fallback veylix) + Checkout/Cancel OK';
  });
}

// ============================================================================
// PHẦN 2: KIỂM THỬ PLAYWRIGHT DESKTOP (1440×900) & MOBILE (390×844)
// ============================================================================
async function runPlaywrightSuite() {
  console.log('\n==================================================================');
  console.log('🌐 BẮT ĐẦU KIỂM THỬ GIAO DIỆN PLAYWRIGHT V3 (DESKTOP & MOBILE)');
  console.log('==================================================================');

  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.print = () => {};
  });

  const consoleErrors = [];
  const pageErrors = [];
  const networkFailures = [];

  const attachWatchers = (targetPage, label) => {
    targetPage.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[${label} ${targetPage.url()}] ${msg.text()}`);
      }
    });
    targetPage.on('pageerror', (err) => {
      pageErrors.push(`[${label} ${targetPage.url()}] ${err.message}`);
    });
    targetPage.on('response', (res) => {
      const status = res.status();
      const url = res.url();
      if (status >= 400 && !url.includes('favicon.ico')) {
        networkFailures.push(`[${label}] ${status} ${res.request().method()} ${url}`);
      }
    });
  };

  attachWatchers(page, 'Desktop');

  try {
    // UI-V3-01: Storefront sang trọng (0% Neubrutalist) + Bảng Cá nhân hóa 4 phong cách × 6 bảng màu × Light/Dark + reload()
    await step('UI-V3-01. Storefront sang trọng (0% Neubrutalist, bo góc mềm) & Cá nhân hóa 4 phong cách + Dark Mode + reload()', async () => {
      await page.goto(`${FE_BASE}/store`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(350);

      const htmlContent = await page.content();
      assert(!htmlContent.toLowerCase().includes('neobrutalist'), 'HTML của /store vẫn còn chuỗi neobrutalist!');

      const sfRoot = page.locator('.sf-root').first();
      assert((await sfRoot.getAttribute('data-sf-style')) === 'veylix', 'Mặc định data-sf-style phải là veylix');
      assert((await sfRoot.getAttribute('data-sf-mode')) === 'light', 'Mặc định data-sf-mode phải là light');

      // Kiểm tra bo góc mềm mại (borderRadius !== '0px')
      const cardRadius = await page.locator('.sf-product-card').first().evaluate((el) => getComputedStyle(el).borderRadius);
      assert(cardRadius && cardRadius !== '0px', `Thẻ sản phẩm phải bo góc mềm mại, nhưng nhận borderRadius=${cardRadius}`);

      // Chụp ảnh 1: Trang chủ Storefront V3 sang trọng (veylix kem ấm)
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'veylix-v3-store-home.png'), fullPage: false });

      // Mở Bảng Cá nhân hóa Giao diện (🎨 Giao diện)
      await page.locator('button.sf-style-trigger').click();
      const styleDialog = page.getByRole('dialog', { name: /Bảng Cá nhân hóa Giao diện/i });
      await styleDialog.waitFor({ state: 'visible', timeout: 5000 });

      // Xác minh chỉ có đúng 4 phong cách tinh tế: veylix, glass, liquid-glass, flat
      for (const st of ['veylix', 'glass', 'liquid-glass', 'flat']) {
        assert((await styleDialog.locator(`button[data-style-option="${st}"]`).count()) === 1, `Thiếu phong cách ${st}`);
      }
      assert((await styleDialog.locator('button[data-style-option="neobrutalist"]').count()) === 0, 'Còn sót nút neobrutalist!');

      // Chuyển thử qua các phong cách, chọn liquid-glass + xanh-rung + dark
      await styleDialog.locator('button[data-style-option="glass"]').click();
      await styleDialog.locator('button[data-style-option="flat"]').click();
      await styleDialog.locator('button[data-style-option="liquid-glass"]').click();
      await styleDialog.locator('button[data-theme-option="xanh-rung"]').click();
      await styleDialog.locator('button[data-mode-option="dark"]').click();
      await page.waitForTimeout(250);

      // Chụp ảnh 2: Bảng Cá nhân hóa Giao diện ở chế độ Dark + Kính Lỏng Hiện Đại
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'veylix-v3-store-personalizer.png'), fullPage: false });

      await styleDialog.getByRole('button', { name: /Hoàn tất & Tiếp tục mua sắm/i }).click();

      // Reload trang để chứng minh giữ nguyên lựa chọn cá nhân hóa
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(250);
      assert((await sfRoot.getAttribute('data-sf-style')) === 'liquid-glass', 'Sau reload mất phong cách liquid-glass');
      assert((await sfRoot.getAttribute('data-sf-theme')) === 'xanh-rung', 'Sau reload mất bảng màu xanh-rung');
      assert((await sfRoot.getAttribute('data-sf-mode')) === 'dark', 'Sau reload mất chế độ dark');

      // Kiểm tra tự fallback nếu localStorage có giá trị cũ 'neobrutalist'
      await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.toLowerCase().includes('style')) {
            localStorage.setItem(k, 'neobrutalist');
          }
        }
      });
      await page.reload({ waitUntil: 'networkidle' });
      assert((await sfRoot.getAttribute('data-sf-style')) !== 'neobrutalist', 'Không tự fallback khỏi giá trị cũ neobrutalist');

      // Đặt lại mặc định sáng 'veylix' để thực hiện luồng mua hàng sáng rõ
      await page.locator('button.sf-style-trigger').click();
      await page.getByRole('button', { name: /Đặt lại mặc định/i }).click();
      await page.getByRole('button', { name: /Hoàn tất & Tiếp tục mua sắm/i }).click();
      return `cardRadius=${cardRadius}, 4 phong cách tinh tế + Dark/Light + reload OK`;
    });

    // UI-V3-02: Storefront UX dễ hiểu 1 chạm (Chip lọc nhanh -> Mua ngay -> Vé giảm giá 1 chạm -> Tra cứu đơn 1 chạm -> Đồng bộ Admin)
    await step('UI-V3-02. Storefront UX "Nhìn là hiểu ngay": Chip lọc 1 chạm, [⚡ Mua ngay], Vé Voucher [Dùng mã này], Đặt hàng & Tra cứu 1 chạm', async () => {
      await page.goto(`${FE_BASE}/store/products`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      // Bấm các chip lọc nhanh 1 chạm
      const budgetChip = page.getByRole('button', { name: /Giá tiết kiệm/i });
      if (await budgetChip.count()) {
        await budgetChip.click();
        await page.waitForTimeout(250);
      }
      const inStockChip = page.getByRole('button', { name: /Còn hàng giao ngay/i });
      if (await inStockChip.count()) {
        await inStockChip.click();
        await page.waitForTimeout(250);
      }

      // Tìm thẻ sản phẩm Balo tối giản Minimal Backpack ($79 >= $40 đủ điều kiện HELLO10 ngay lập tức) và bấm [⚡ Mua ngay]
      const backpackCard = page.locator('.sf-product-card').filter({ hasText: /Minimal Backpack/i }).first();
      await backpackCard.waitFor({ state: 'visible', timeout: 5000 });
      const cardText = await backpackCard.innerText();
      assert(cardText.includes('Còn sẵn') || cardText.includes('Sắp hết'), 'Thẻ SP thiếu nhãn tồn kho tiếng Việt rõ ràng');

      await backpackCard.getByRole('button', { name: /Mua ngay/i }).click();
      await page.waitForURL('**/store/checkout', { timeout: 10000 });
      await page.waitForTimeout(250);

      // Bấm [⚡ Điền nhanh thông tin mẫu] & bấm [Dùng mã này] trên thẻ Voucher HELLO10
      await page.getByRole('button', { name: /Điền nhanh/i }).first().click();

      const helloTicket = page.locator('.sf-voucher-ticket').filter({ hasText: 'HELLO10' }).first();
      await helloTicket.waitFor({ state: 'visible', timeout: 5000 });
      const [cpResp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/store/validate-coupon') && r.request().method() === 'POST', { timeout: 10000 }),
        helloTicket.getByRole('button', { name: /Dùng mã này|Đang dùng/i }).click(),
      ]);
      assert(cpResp.status() === 200, 'Áp mã HELLO10 từ thẻ Vé Giảm Giá lỗi');

      const [coResp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/store/checkout') && r.request().method() === 'POST', { timeout: 10000 }),
        page.getByRole('button', { name: /Hoàn tất đặt hàng/i }).click(),
      ]);
      assert(coResp.status() < 300, 'Hoàn tất đặt hàng lỗi');
      const coJson = await coResp.json();
      const orderCode = coJson?.data?.order?.orderCode || coJson?.data?.order?.id;
      await page.getByRole('heading', { name: /Đặt hàng thành công/i }).waitFor({ state: 'visible', timeout: 5000 });

      // Sang /store/orders bấm chip đơn gần đây 1 chạm
      await page.goto(`${FE_BASE}/store/orders`, { waitUntil: 'networkidle' });
      const orderChip = page.getByRole('button', { name: new RegExp(orderCode, 'i') }).first();
      await orderChip.waitFor({ state: 'visible', timeout: 5000 });
      await orderChip.click();
      await page.waitForTimeout(350);
      assert((await page.locator('body').innerText()).includes(orderCode), 'Tra cứu nhanh bằng chip 1 chạm lỗi');

      return `Mua ngay + Voucher 1 chạm + Đặt đơn #${orderCode} + Chip tra cứu OK`;
    });

    // UI-V3-03: Kiểm toán toàn bộ nút bấm & tính năng mới trên 18 trang Admin chính
    await step('UI-V3-03. Kiểm toán Admin chính: Overview tương tác, Categories Xem SP, Fulfillment bulk-advance, Transactions Biên lai, Reviews AI Reply & Xóa, Users Khóa/Mở, Settings Map', async () => {
      // 1) OverviewPage: kiểm tra Thao tác nhanh + bấm xem chi tiết vận đơn trực tiếp
      await page.goto(`${FE_BASE}/overview`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const ovText = await page.locator('body').innerText();
      assert(ovText.includes('Tạo đơn hàng') && ovText.includes('Thêm sản phẩm'), 'Overview thiếu thanh Thao tác nhanh');

      // 2) CategoriesPage: bấm Xem SP mở Modal sản phẩm thuộc danh mục
      await page.goto(`${FE_BASE}/commerce/categories`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /Xem SP/i }).first().click();
      const catModal = page.locator('dialog, [role="dialog"]').last();
      await catModal.waitFor({ state: 'visible', timeout: 5000 });
      const filterLinkBtn = catModal.locator('a, button').filter({ hasText: /Mở trang Sản phẩm|Xem trên trang Sản phẩm|Lọc sản phẩm/i }).first();
      if (await filterLinkBtn.count()) {
        await filterLinkBtn.click();
        await page.waitForURL('**/commerce/products**', { timeout: 5000 });
      } else {
        await page.keyboard.press('Escape');
      }

      // 3) FulfillmentPage: In phiếu & Chuyển bước giao hàng hàng loạt
      const tempOrd = await apiFetch('/orders', {
        method: 'POST',
        body: { customerName: 'Khách Vận Đơn V3', total: 60, paymentStatus: 'Paid', fulfillmentStatus: 'Processing' },
      });
      const tempSh = await apiFetch('/shipments', {
        method: 'POST',
        body: { orderId: tempOrd.json.data.id, carrier: 'GHN', destination: 'Hải Châu, Đà Nẵng' },
      });
      const trkId = tempSh.json.data.id;

      await page.goto(`${FE_BASE}/commerce/fulfillment`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /In phiếu/i }).first().click();
      await page.locator('dialog, [role="dialog"]').last().getByRole('button', { name: 'Đóng', exact: true }).click();

      const shRow = page.locator('tbody tr').filter({ hasText: trkId }).first();
      await shRow.locator('input[type="checkbox"]').check();
      const [bulkAdvResp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/shipments/bulk-advance') && r.request().method() === 'POST', { timeout: 10000 }),
        page.getByRole('button', { name: /Chuyển bước giao hàng hàng loạt/i }).click(),
      ]);
      assert(bulkAdvResp.status() === 200, 'Chuyển bước giao hàng hàng loạt từ UI lỗi');

      // 4) TransactionsPage: Lọc cổng 1 chạm & mở Biên lai thanh toán điện tử
      await page.goto(`${FE_BASE}/commerce/transactions`, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /^Biên lai$/i }).first().click();
      await page.getByText(/VEYLIX COMMERCE STUDIO/i).waitFor({ state: 'visible', timeout: 5000 });
      await page.locator('dialog, [role="dialog"]').last().getByRole('button', { name: 'Đóng', exact: true }).click();

      // 5) ReviewsPage: Gợi ý phản hồi bằng AI + chụp ảnh + Xóa đánh giá qua DialogModal
      const spamRev = await apiFetch('/store/reviews', {
        method: 'POST',
        body: { productName: 'Ly sứ Ceramic Mug', customerName: 'Khách Thử Xóa UI', rating: 5, title: 'Đánh giá thử xóa V3', comment: 'Kiểm thử nút xóa đánh giá trên UI' },
      });
      const spamTitle = (spamRev.json?.data?.review || spamRev.json?.data)?.title;

      await page.goto(`${FE_BASE}/commerce/reviews`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /Trả lời|Sửa phản hồi/i }).first().click();
      const [aiReplyResp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/ai/generate') && r.request().method() === 'POST', { timeout: 10000 }),
        page.getByRole('button', { name: /Gợi ý phản hồi bằng AI/i }).click(),
      ]);
      assert(aiReplyResp.status() < 300, 'Gợi ý phản hồi bằng AI trên ReviewsPage lỗi');
      await page.waitForTimeout(250);

      // Chụp ảnh 3: Admin ReviewsPage kèm Modal Gợi ý phản hồi bằng AI
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'veylix-v3-admin-reviews-ai.png'), fullPage: false });
      await page.locator('dialog, [role="dialog"]').last().getByRole('button', { name: /Hủy/i }).click();

      // Xóa đánh giá tạm vừa tạo
      const revCard = page.locator('.glass-card').filter({ hasText: spamTitle }).first();
      await revCard.getByRole('button', { name: /^Xóa$/i }).click();
      const [delRevResp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/reviews/') && r.request().method() === 'DELETE', { timeout: 10000 }),
        page.getByRole('button', { name: /Xác nhận xóa/i }).click(),
      ]);
      assert(delRevResp.status() === 200, 'Xóa đánh giá trên ReviewsPage lỗi');

      // 6) UsersPage: Tạm khóa & Mở khóa thành viên
      await page.goto(`${FE_BASE}/commerce/users`, { waitUntil: 'networkidle' });
      const lockBtn = page.getByRole('button', { name: /Tạm khóa/i }).first();
      await lockBtn.waitFor({ state: 'visible', timeout: 5000 });
      const [uLockResp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/users/') && r.request().method() === 'PUT', { timeout: 10000 }),
        lockBtn.click(),
      ]);
      assert(uLockResp.status() === 200, 'Tạm khóa nhân viên trên UsersPage lỗi');

      const unlockBtn = page.getByRole('button', { name: /Mở khóa/i }).first();
      const [uUnlockResp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/users/') && r.request().method() === 'PUT', { timeout: 10000 }),
        unlockBtn.click(),
      ]);
      assert(uUnlockResp.status() === 200, 'Mở khóa nhân viên trên UsersPage lỗi');

      // 7) GeneralSettingsPage: kiểm tra Bản đồ Cài đặt Nhanh
      await page.goto(`${FE_BASE}/commerce/settings-general`, { waitUntil: 'networkidle' });
      const settingsLinks = await page.locator('a[href*="/commerce/settings-seo"], a[href*="/commerce/shipping-rules"]').count();
      assert(settingsLinks >= 2, 'GeneralSettingsPage thiếu Bản đồ Cài đặt Nhanh');

      return 'Overview + Categories + Fulfillment Bulk + Transactions Receipt + Reviews AI/Delete + Users Lock/Unlock + Settings Map OK';
    });

    // UI-V3-04: Kiểm toán các Giao diện Trực quan mới của @admin-modules
    await step('UI-V3-04. Các trang trực quan @admin-modules: Media Gallery, Warehouses Cards, Carriers/Providers Toggle, Webhooks Ping, Notifications Center & Store Style', async () => {
      // 1) /commerce/media: Lưới ảnh thật + Lightbox + Sao chép URL + chụp ảnh
      await page.goto(`${FE_BASE}/commerce/media`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'veylix-v3-admin-media.png'), fullPage: false });

      await page.getByRole('button', { name: /Sao chép URL/i }).first().click();
      await page.getByRole('button', { name: /Xem lớn/i }).first().click();
      const lbDialog = page.locator('dialog, [role="dialog"]').last();
      await lbDialog.waitFor({ state: 'visible', timeout: 5000 });
      await page.keyboard.press('Escape');

      // 2) /commerce/warehouses: Thẻ kho trực quan có thanh % sức chứa & đối soát 3 miền
      await page.goto(`${FE_BASE}/commerce/warehouses`, { waitUntil: 'networkidle' });
      const whText = await page.locator('body').innerText();
      assert(whText.includes('sức chứa') && whText.includes('Kho NY'), 'Trang /commerce/warehouses thiếu thẻ công suất / đối soát 3 miền');

      // 3) /commerce/carriers & /commerce/providers: Gạt công tắc Bật/Tắt 1 chạm rồi trả lại
      for (const route of ['/commerce/carriers', '/commerce/providers']) {
        await page.goto(`${FE_BASE}${route}`, { waitUntil: 'networkidle' });
        const toggleBtn = page.locator('[role="switch"]').first();
        await toggleBtn.waitFor({ state: 'visible', timeout: 5000 });
        const [put1] = await Promise.all([
          page.waitForResponse((r) => r.url().includes('/api/modules/') && r.request().method() === 'PUT', { timeout: 10000 }),
          toggleBtn.click(),
        ]);
        assert(put1.status() === 200, `Gạt công tắc trên ${route} lỗi`);
        await Promise.all([
          page.waitForResponse((r) => r.url().includes('/api/modules/') && r.request().method() === 'PUT', { timeout: 10000 }),
          toggleBtn.click(),
        ]);
      }

      // 4) /commerce/webhooks: Bấm [⚡ Gửi Ping kiểm tra]
      await page.goto(`${FE_BASE}/commerce/webhooks`, { waitUntil: 'networkidle' });
      const [pingResp] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/modules/webhooks/') && r.request().method() === 'PUT', { timeout: 10000 }),
        page.getByRole('button', { name: /Gửi Ping kiểm tra/i }).first().click(),
      ]);
      assert(pingResp.status() === 200, 'Gửi Ping kiểm tra trên /commerce/webhooks lỗi');
      assert((await page.locator('body').innerText()).includes('HTTP 200 OK'), 'Chưa hiển thị kết quả phản hồi Ping HTTP 200 OK');

      // 5) /commerce/notifications: Trung tâm thông báo đồng bộ
      await page.goto(`${FE_BASE}/commerce/notifications`, { waitUntil: 'networkidle' });
      assert((await page.locator('body').innerText()).includes('Tổng thông báo'), 'Trang /commerce/notifications chưa tải');

      // 6) /commerce/store: Xác minh 0% neobrutalist và có đủ 4 phong cách sang trọng
      await page.goto(`${FE_BASE}/commerce/store`, { waitUntil: 'networkidle' });
      const adminStoreHtml = await page.content();
      assert(!adminStoreHtml.toLowerCase().includes('neobrutalist'), 'Trang /commerce/store vẫn còn tùy chọn neobrutalist!');
      assert(adminStoreHtml.includes('Kính Lỏng Hiện Đại') && adminStoreHtml.includes('Veylix Kem Ấm'), 'Trang /commerce/store thiếu tùy chọn phong cách sang trọng');

      return 'Media Gallery + Warehouses + Carriers/Providers Toggle + Webhooks Ping + Notifications + Store Config OK';
    });

    // UI-V3-05: Kiểm thử Responsive trên Mobile (390×844) cho cả Storefront & Admin
    await step('UI-V3-05. Kiểm thử giao diện Mobile (390×844) trên Storefront & Admin', async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const mPage = await mobileContext.newPage();
      attachWatchers(mPage, 'Mobile');

      try {
        await mPage.goto(`${FE_BASE}/store`, { waitUntil: 'networkidle' });
        await mPage.waitForTimeout(250);
        // Mở menu điều hướng Mobile Storefront
        await mPage.locator('button.sf-mobile-toggle').click();
        await mPage.getByRole('button', { name: /Đổi Phong cách & Giao diện/i }).first().click();
        await mPage.getByRole('dialog', { name: /Bảng Cá nhân hóa Giao diện/i }).waitFor({ state: 'visible', timeout: 5000 });
        await mPage.getByRole('button', { name: /Hoàn tất & Tiếp tục mua sắm/i }).click();

        await mPage.goto(`${FE_BASE}/store/products`, { waitUntil: 'networkidle' });
        assert((await mPage.locator('.sf-product-card').count()) > 0, 'Mobile /store/products không hiển thị sản phẩm');

        await mPage.goto(`${FE_BASE}/overview`, { waitUntil: 'networkidle' });
        const mobileNavBtn = mPage.locator('button.mobile-menu');
        if (await mobileNavBtn.isVisible()) {
          await mobileNavBtn.click();
        }

        await mPage.goto(`${FE_BASE}/commerce/media`, { waitUntil: 'networkidle' });
        assert((await mPage.locator('body').innerText()).includes('Sao chép URL'), 'Mobile /commerce/media lỗi hiển thị');
      } finally {
        await mobileContext.close();
      }
      return 'Mobile 390×844 Storefront & Admin hiển thị mượt mà';
    });

    // UI-V3-06: Xác minh console.error = 0, pageerror = 0, và 0 request 404/500
    await step('UI-V3-06. Xác minh console.error = 0, pageerror = 0, và 0 request lỗi 404/500 (Desktop + Mobile)', async () => {
      assert(consoleErrors.length === 0, `Phát hiện ${consoleErrors.length} console.error:\n${consoleErrors.join('\n')}`);
      assert(pageErrors.length === 0, `Phát hiện ${pageErrors.length} pageerror:\n${pageErrors.join('\n')}`);
      assert(networkFailures.length === 0, `Phát hiện ${networkFailures.length} lỗi HTTP >= 400:\n${networkFailures.join('\n')}`);
      return '0 console.error, 0 pageerror, 0 lỗi HTTP 404/500';
    });
  } finally {
    await browser.close();
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  if (runApi) {
    await runApiSuite();
  }
  if (runUi) {
    await runPlaywrightSuite();
  }

  console.log('\n==================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ V3: ${results.passed.length} PASS | ${results.failed.length} FAIL`);
  console.log('==================================================================');

  if (results.failed.length > 0) {
    for (const f of results.failed) {
      console.error(`  - [FAIL] ${f.name}: ${f.error}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Lỗi nghiêm trọng khi chạy verify-integration:', err);
  process.exit(1);
});
