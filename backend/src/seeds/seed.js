import 'dotenv/config';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  Category,
  Brand,
  Product,
  StockItem,
  Customer,
  Segment,
  Order,
  Shipment,
  Coupon,
  Review,
  Transaction,
  Vendor,
  Conversation,
  AiWorkflow,
  TeamMember,
  Notification,
  StoreSetting,
  ModuleRecord,
  ModuleConfig,
} from '../models/index.js';
import {
  categoriesSeed,
  brandsSeed,
  productsSeed,
  stockItemsSeed,
  customersSeed,
  segmentsSeed,
  ordersSeed,
  shipmentsSeed,
  couponsSeed,
  reviewsSeed,
  transactionsSeed,
  vendorsSeed,
  conversationsSeed,
  aiWorkflowsSeed,
  teamMembersSeed,
  notificationsSeed,
  storeSettingSeed,
  moduleRecordsSeed,
  moduleConfigsSeed,
  buildDefaultModuleRecords,
  getDefaultModuleConfig,
} from './seedData.js';

function withChronologicalTimestamps(items, baseTime = Date.now()) {
  return items.map((item, idx) => ({
    ...item,
    createdAt: new Date(baseTime - idx * 60_000),
    updatedAt: new Date(baseTime - idx * 60_000),
  }));
}

/**
 * Nạp dữ liệu mẫu cho toàn bộ 19 collections (gồm ModuleConfig V2) và liên kết khóa ngoại ObjectId nhất quán.
 * @param {{ force?: boolean, silent?: boolean }} options
 */
export async function seedDatabase({ force = false, silent = false } = {}) {
  const [existingProductsCount, existingConfigsCount] = await Promise.all([
    Product.countDocuments(),
    ModuleConfig.countDocuments(),
  ]);

  if (!force && existingProductsCount > 0) {
    // Nếu DB local từ phiên bản V1 chưa có ModuleConfig thì tự động nạp bổ sung ModuleConfig
    if (existingConfigsCount === 0) {
      const now = Date.now();
      await ModuleConfig.insertMany(withChronologicalTimestamps(moduleConfigsSeed, now));
      if (!silent) {
        console.log(`[seed] Đã bổ sung ${moduleConfigsSeed.length} cấu hình ModuleConfig cho DB hiện có.`);
      }
    }
    if (!silent) {
      console.log(`[seed] Cơ sở dữ liệu đã có dữ liệu (${existingProductsCount} sản phẩm), bỏ qua seed.`);
    }
    return { seeded: false, reason: 'already_populated', existingProductsCount };
  }

  if (force) {
    await Promise.all([
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Product.deleteMany({}),
      StockItem.deleteMany({}),
      Customer.deleteMany({}),
      Segment.deleteMany({}),
      Order.deleteMany({}),
      Shipment.deleteMany({}),
      Coupon.deleteMany({}),
      Review.deleteMany({}),
      Transaction.deleteMany({}),
      Vendor.deleteMany({}),
      Conversation.deleteMany({}),
      AiWorkflow.deleteMany({}),
      TeamMember.deleteMany({}),
      Notification.deleteMany({}),
      StoreSetting.deleteMany({}),
      ModuleRecord.deleteMany({}),
      ModuleConfig.deleteMany({}),
    ]);
  }

  const now = Date.now();

  // 1. Nạp các bảng danh mục gốc (Category, Brand, Customer, Segment)
  const [categories, brands, customers, segments] = await Promise.all([
    Category.insertMany(withChronologicalTimestamps(categoriesSeed, now)),
    Brand.insertMany(withChronologicalTimestamps(brandsSeed, now)),
    Customer.insertMany(withChronologicalTimestamps(customersSeed, now)),
    Segment.insertMany(withChronologicalTimestamps(segmentsSeed, now)),
  ]);

  const categoryByName = new Map(categories.map((c) => [c.name, c._id]));
  const brandByName = new Map(brands.map((b) => [b.name, b._id]));
  const customerByEmail = new Map(customers.map((c) => [c.email.toLowerCase(), c._id]));
  const customerByName = new Map(customers.map((c) => [c.name, c._id]));

  // 2. Nạp Products (liên kết categoryRef & brandRef) và Orders (liên kết customerRef)
  const productsPayload = withChronologicalTimestamps(productsSeed, now).map((p) => ({
    ...p,
    categoryRef: categoryByName.get(p.category) || null,
    brandRef: brandByName.get(p.brand) || null,
  }));

  const ordersPayload = withChronologicalTimestamps(ordersSeed, now).map((o) => ({
    ...o,
    customerRef:
      customerByEmail.get(o.customer.email?.toLowerCase()) ||
      customerByName.get(o.customer.name) ||
      null,
  }));

  const [products, orders] = await Promise.all([
    Product.insertMany(productsPayload),
    Order.insertMany(ordersPayload),
  ]);

  const productBySku = new Map(products.map((p) => [p.sku, p._id]));
  const productByName = new Map(products.map((p) => [p.name, p._id]));
  const orderByCode = new Map(orders.map((o) => [o.orderCode, o._id]));

  // 3. Nạp các bảng phụ thuộc + ModuleConfig + ModuleRecord giàu chi tiết
  const stockPayload = withChronologicalTimestamps(stockItemsSeed, now).map((s) => ({
    ...s,
    productRef: productBySku.get(s.sku) || null,
  }));

  const shipmentsPayload = shipmentsSeed.map((s, idx) => ({
    ...s,
    orderRef: orderByCode.get(s.orderId) || null,
    createdAt: new Date(now - idx * 60_000),
  }));

  const transactionsPayload = withChronologicalTimestamps(transactionsSeed, now).map((t) => ({
    ...t,
    orderRef: orderByCode.get(t.orderId) || null,
  }));

  const reviewsPayload = withChronologicalTimestamps(reviewsSeed, now).map(
    ({ customerEmail, ...r }) => ({
      ...r,
      productRef: productByName.get(r.productName) || null,
      customerRef:
        (customerEmail && customerByEmail.get(customerEmail.toLowerCase())) ||
        customerByName.get(r.customerName) ||
        null,
    })
  );

  const conversationsPayload = withChronologicalTimestamps(conversationsSeed, now).map(
    ({ customerEmail, ...c }) => ({
      ...c,
      customerRef:
        (customerEmail && customerByEmail.get(customerEmail.toLowerCase())) ||
        customerByName.get(c.customer) ||
        null,
    })
  );

  const [
    stockItems,
    shipments,
    coupons,
    reviews,
    transactions,
    vendors,
    conversations,
    aiWorkflows,
    teamMembers,
    notifications,
    storeSetting,
    moduleRecords,
    moduleConfigs,
  ] = await Promise.all([
    StockItem.insertMany(stockPayload),
    Shipment.insertMany(shipmentsPayload),
    Coupon.insertMany(withChronologicalTimestamps(couponsSeed, now)),
    Review.insertMany(reviewsPayload),
    Transaction.insertMany(transactionsPayload),
    Vendor.insertMany(withChronologicalTimestamps(vendorsSeed, now)),
    Conversation.insertMany(conversationsPayload),
    AiWorkflow.insertMany(withChronologicalTimestamps(aiWorkflowsSeed, now)),
    TeamMember.insertMany(withChronologicalTimestamps(teamMembersSeed, now)),
    Notification.insertMany(withChronologicalTimestamps(notificationsSeed, now)),
    StoreSetting.create(storeSettingSeed),
    ModuleRecord.insertMany(withChronologicalTimestamps(moduleRecordsSeed, now)),
    ModuleConfig.insertMany(withChronologicalTimestamps(moduleConfigsSeed, now)),
  ]);

  const counts = {
    categories: categories.length,
    brands: brands.length,
    products: products.length,
    stockItems: stockItems.length,
    customers: customers.length,
    segments: segments.length,
    orders: orders.length,
    shipments: shipments.length,
    coupons: coupons.length,
    reviews: reviews.length,
    transactions: transactions.length,
    vendors: vendors.length,
    conversations: conversations.length,
    aiWorkflows: aiWorkflows.length,
    teamMembers: teamMembers.length,
    notifications: notifications.length,
    storeSettings: storeSetting ? 1 : 0,
    moduleRecords: moduleRecords.length,
    moduleConfigs: moduleConfigs.length,
  };

  if (!silent) {
    console.log('[seed] Đã khởi tạo dữ liệu mẫu V2 thành công cho 19 collections:', counts);
  }

  return { seeded: true, counts };
}

export async function seedDatabaseIfEmpty(options = {}) {
  return seedDatabase({ ...options, force: false });
}

export const seedIfEmpty = seedDatabaseIfEmpty;
export { buildDefaultModuleRecords, getDefaultModuleConfig };
export default seedDatabase;

// Cho phép chạy trực tiếp qua CLI: `npm run seed` (node src/seeds/seed.js)
const isDirectExecution =
  Boolean(process.argv[1]) &&
  pathToFileURL(path.resolve(process.argv[1])).href.toLowerCase() ===
    import.meta.url.toLowerCase();

if (isDirectExecution) {
  (async () => {
    const { connectDB, disconnectDB, getDbStatus } = await import('../config/db.js');
    const onlyIfEmpty = process.argv.includes('--if-empty');

    try {
      await connectDB({ autoSeed: false });
      const status = getDbStatus();
      console.log(`[seed] Đã kết nối DB (mode=${status.mode}, uri=${status.uri})`);
      await seedDatabase({ force: !onlyIfEmpty });
    } catch (error) {
      console.error('[seed] Lỗi khi khởi tạo dữ liệu mẫu:', error);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
    }
  })();
}
