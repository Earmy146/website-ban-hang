import mongoose from 'mongoose';
import {
  StoreSetting,
  ModuleConfig,
  Category,
  Product,
  StockItem,
  Coupon,
  Review,
  ModuleRecord,
  Order,
  Shipment,
  Transaction,
  Customer,
  Notification,
  Conversation
} from '../models/index.js';
import {
  DEFAULT_MODULE_CONFIGS,
  normalizeStorefrontStyleSettings
} from './workspaceController.js';
import { AppError, asyncHandler, sendCreated, sendSuccess } from '../utils/apiResponse.js';
import {
  computeProductStatusFromInventory,
  computeStockStatus,
  escapeRegex,
  findByCodeOrId,
  formatViDate,
  formatViTime,
  makeAvatarInitials
} from '../utils/helpers.js';
import {
  requireNonEmptyString,
  requireNumber,
  requireValidEmail
} from '../middleware/validate.js';

async function ensureConfig(slug) {
  let doc = await ModuleConfig.findOne({ slug });
  if (!doc && DEFAULT_MODULE_CONFIGS[slug]) {
    const def = DEFAULT_MODULE_CONFIGS[slug];
    doc = await ModuleConfig.create({
      slug,
      title: def.title,
      group: def.group,
      settings: slug === 'store' ? normalizeStorefrontStyleSettings(def.settings) : def.settings,
      updatedBy: 'Alex Chen'
    });
  } else if (doc && slug === 'store') {
    const cur = doc.settings || {};
    const normalized = normalizeStorefrontStyleSettings(cur);
    if (
      cur.defaultUiStyle !== normalized.defaultUiStyle ||
      cur.defaultColorTheme !== normalized.defaultColorTheme ||
      cur.defaultColorMode !== normalized.defaultColorMode
    ) {
      doc.settings = normalized;
      doc.markModified('settings');
      await doc.save();
    }
  }
  return doc;
}

async function generateUniqueCode(Model, field, prefix) {
  for (let i = 0; i < 20; i += 1) {
    const code = `${prefix}${Math.floor(10000 + Math.random() * 90000)}`;
    const exists = await Model.exists({ [field]: code });
    if (!exists) return code;
  }
  return `${prefix}${Date.now().toString().slice(-5)}`;
}

function evaluateCoupon(coupon, subtotal) {
  if (!coupon) {
    throw new AppError('Mã giảm giá không tồn tại. Vui lòng kiểm tra lại.', 400, 'INVALID_COUPON');
  }
  if (coupon.status !== 'Active') {
    throw new AppError(
      coupon.status === 'Expired'
        ? `Mã giảm giá "${coupon.code}" đã hết hạn sử dụng.`
        : `Mã giảm giá "${coupon.code}" chưa đến thời gian kích hoạt.`,
      400,
      'INACTIVE_COUPON'
    );
  }
  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError(
      `Mã giảm giá "${coupon.code}" đã hết lượt sử dụng (${coupon.usageLimit} lượt).`,
      400,
      'COUPON_LIMIT_REACHED'
    );
  }
  if (subtotal < (coupon.minSpend || 0)) {
    throw new AppError(
      `Đơn hàng tối thiểu $${Number(coupon.minSpend).toFixed(2)} để áp dụng mã ${coupon.code} (hiện tại: $${subtotal.toFixed(2)}).`,
      400,
      'MIN_SPEND_NOT_MET'
    );
  }

  let discountAmount = 0;
  let freeShipping = false;
  let message = '';

  if (coupon.discountType === 'Phần trăm (%)') {
    discountAmount = +((subtotal * Number(coupon.value || 0)) / 100).toFixed(2);
    message = `Đã áp dụng mã ${coupon.code}: Giảm ${coupon.value}% (-$${discountAmount.toFixed(2)})`;
  } else if (coupon.discountType === 'Số tiền cố định ($)') {
    discountAmount = +Math.min(subtotal, Number(coupon.value || 0)).toFixed(2);
    message = `Đã áp dụng mã ${coupon.code}: Giảm trực tiếp $${discountAmount.toFixed(2)}`;
  } else {
    freeShipping = true;
    message = `Đã áp dụng mã ${coupon.code}: Miễn phí vận chuyển toàn đơn hàng`;
  }

  return { discountAmount, freeShipping, message };
}

// ==========================================
// 1. STOREFRONT HOME & CATALOG
// ==========================================

export const getStoreHome = asyncHandler(async (_req, res) => {
  const [
    settingsDoc,
    storefrontConfig,
    maintenance,
    shippingConfig,
    categories,
    featuredProducts,
    activeCoupons,
    reviews,
    existingFaqs
  ] = await Promise.all([
    StoreSetting.findOne({ key: 'general' }),
    ensureConfig('store'),
    ensureConfig('settings-maintenance'),
    ensureConfig('shipping-rules'),
    Category.find({ status: 'Active' }).sort({ sortOrder: 1 }),
    Product.find({ isDeleted: { $ne: true }, status: { $nin: ['Draft', 'Archived'] } })
      .sort({ sales: -1, createdAt: -1 })
      .limit(12),
    Coupon.find({ status: 'Active' }).sort({ createdAt: -1 }),
    Review.find({ status: 'Published' }).sort({ rating: -1, createdAt: -1 }).limit(8),
    ModuleRecord.find({ moduleSlug: 'faqs' }).sort({ createdAt: 1 })
  ]);

  let faqs = existingFaqs;
  if (faqs.length === 0) {
    faqs = await ModuleRecord.insertMany([
      {
        moduleSlug: 'faqs',
        name: 'Thời gian giao hàng tiêu chuẩn tại Veylix mất bao lâu?',
        code: 'FAQ-01',
        date: 'Hôm nay',
        status: 'Hoạt động',
        statusClass: 'green',
        count: 1,
        value: 'Vận chuyển',
        subtitle: 'Giao hàng nội thành 24h và toàn quốc từ 2–3 ngày làm việc.',
        category: 'Vận chuyển',
        notes: 'Đơn hàng từ $75 được miễn phí vận chuyển tiêu chuẩn toàn quốc.'
      },
      {
        moduleSlug: 'faqs',
        name: 'Chính sách đổi trả sản phẩm trong 30 ngày như thế nào?',
        code: 'FAQ-02',
        date: 'Hôm nay',
        status: 'Hoạt động',
        statusClass: 'green',
        count: 1,
        value: 'Đổi trả',
        subtitle: 'Hỗ trợ đổi size hoặc hoàn tiền 100% trong 30 ngày với sản phẩm còn nguyên tem.',
        category: 'Đổi trả & Bảo hành',
        notes: 'Áp dụng cho toàn bộ trang phục, balo và phụ kiện mua trực tuyến.'
      }
    ]);
  }

  return sendSuccess(res, {
    settings: settingsDoc,
    storefrontConfig,
    maintenance,
    shippingConfig,
    categories,
    featuredProducts,
    activeCoupons: activeCoupons.filter(
      (c) => !c.usageLimit || c.usageCount < c.usageLimit
    ),
    reviews,
    faqs
  });
});

export const getStoreProducts = asyncHandler(async (req, res) => {
  const { search, category, brand, minPrice, maxPrice, inStockOnly, sort } = req.query;
  const filter = {
    isDeleted: { $ne: true },
    status: { $nin: ['Draft', 'Archived'] }
  };

  if (category && category !== 'all') {
    filter.category = category;
  }
  if (brand && brand !== 'all') {
    filter.brand = brand;
  }
  if (minPrice !== undefined && minPrice !== '') {
    const min = Number(minPrice);
    if (Number.isFinite(min)) {
      filter.price = { ...(filter.price || {}), $gte: min };
    }
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    const max = Number(maxPrice);
    if (Number.isFinite(max)) {
      filter.price = { ...(filter.price || {}), $lte: max };
    }
  }
  if (inStockOnly === 'true') {
    filter.inventory = { $gt: 0 };
  }
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { category: rx }, { brand: rx }, { desc: rx }];
  }

  let sortSpec = { sales: -1, rating: -1 };
  if (sort === 'newest') sortSpec = { createdAt: -1 };
  else if (sort === 'price_asc') sortSpec = { price: 1 };
  else if (sort === 'price_desc') sortSpec = { price: -1 };
  else if (sort === 'rating') sortSpec = { rating: -1, sales: -1 };

  const products = await Product.find(filter).sort(sortSpec);
  return sendSuccess(res, products, { total: products.length });
});

export const getStoreProductDetail = asyncHandler(async (req, res) => {
  const raw = requireNonEmptyString(req.params.idOrSku, 'mã sản phẩm', 'idOrSku');
  const query = mongoose.isValidObjectId(raw)
    ? { isDeleted: { $ne: true }, $or: [{ _id: raw }, { sku: raw.toUpperCase() }] }
    : { isDeleted: { $ne: true }, sku: raw.toUpperCase() };

  const product = await Product.findOne(query);
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm này trong cửa hàng.', 404, 'NOT_FOUND');
  }

  const [stock, reviews, sameCatRelated] = await Promise.all([
    StockItem.findOne({ $or: [{ productRef: product._id }, { sku: product.sku }] }),
    Review.find({
      status: 'Published',
      $or: [{ productRef: product._id }, { productName: product.name }]
    }).sort({ createdAt: -1 }),
    Product.find({
      _id: { $ne: product._id },
      isDeleted: { $ne: true },
      status: { $nin: ['Draft', 'Archived'] },
      category: product.category
    })
      .sort({ sales: -1 })
      .limit(4)
  ]);

  let relatedProducts = sameCatRelated;
  if (relatedProducts.length < 4) {
    const excludeIds = [product._id, ...relatedProducts.map((p) => p._id)];
    const extra = await Product.find({
      _id: { $nin: excludeIds },
      isDeleted: { $ne: true },
      status: { $nin: ['Draft', 'Archived'] }
    })
      .sort({ sales: -1 })
      .limit(4 - relatedProducts.length);
    relatedProducts = [...relatedProducts, ...extra];
  }

  return sendSuccess(res, {
    product,
    stock,
    reviews,
    relatedProducts
  });
});

// ==========================================
// 2. COUPON VALIDATION & CHECKOUT (6 COLLECTIONS)
// ==========================================

export const validateStoreCoupon = asyncHandler(async (req, res) => {
  const code = requireNonEmptyString(req.body.code, 'mã giảm giá', 'code').toUpperCase();
  const subtotal = requireNumber(req.body.subtotal, 'Tạm tính giỏ hàng', { min: 0, fieldName: 'subtotal' });

  const coupon = await Coupon.findOne({ code });
  const result = evaluateCoupon(coupon, subtotal);

  return sendSuccess(res, {
    coupon,
    discountAmount: result.discountAmount,
    freeShipping: result.freeShipping,
    message: result.message
  });
});

export const storeCheckout = asyncHandler(async (req, res) => {
  const custInput = req.body.customer || {};
  const customerName = requireNonEmptyString(custInput.name, 'họ tên người nhận', 'customer.name');
  const customerEmail = requireValidEmail(custInput.email, 'email nhận xác nhận đơn', 'customer.email');
  const customerPhone = requireNonEmptyString(custInput.phone, 'số điện thoại liên hệ', 'customer.phone');
  const customerAddress = requireNonEmptyString(custInput.address, 'địa chỉ giao hàng', 'customer.address');
  const fullAddress = custInput.city
    ? `${customerAddress}, ${String(custInput.city).trim()}`
    : customerAddress;

  const rawItems = req.body.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError('Giỏ hàng đang trống. Vui lòng chọn ít nhất một sản phẩm trước khi thanh toán.', 400, 'EMPTY_CART');
  }

  // 1. Tra cứu và kiểm tra tồn kho thực tế của từng sản phẩm
  const resolvedItems = [];
  for (const item of rawItems) {
    const qty = Math.round(
      requireNumber(item.quantity, `Số lượng sản phẩm "${item.name || item.sku || ''}"`, {
        min: 1,
        fieldName: 'quantity'
      })
    );
    const prodRefId = item.productId || item.id;
    let product = null;

    if (prodRefId && mongoose.isValidObjectId(prodRefId)) {
      product = await Product.findOne({ _id: prodRefId, isDeleted: { $ne: true } });
    }
    if (!product && item.sku) {
      product = await Product.findOne({ sku: String(item.sku).trim().toUpperCase(), isDeleted: { $ne: true } });
    }
    if (!product && item.name) {
      product = await Product.findOne({
        name: new RegExp(`^${escapeRegex(String(item.name).trim())}$`, 'i'),
        isDeleted: { $ne: true }
      });
    }

    if (!product) {
      throw new AppError(
        `Sản phẩm "${item.name || item.sku || prodRefId}" không tồn tại hoặc đã ngừng kinh doanh.`,
        404,
        'PRODUCT_NOT_FOUND'
      );
    }

    if ((product.inventory || 0) < qty) {
      throw new AppError(
        `Sản phẩm "${product.name}" chỉ còn ${product.inventory || 0} chiếc trong kho (bạn đang chọn ${qty}).`,
        400,
        'INSUFFICIENT_INVENTORY'
      );
    }

    resolvedItems.push({
      product,
      qty,
      unitPrice: Number(product.price) || Number(item.price) || 0,
      variant: item.variant ? String(item.variant).trim() : ''
    });
  }

  // 2. Tính toán tổng tiền, mã giảm giá, phí vận chuyển & thuế VAT
  const subtotal = +resolvedItems.reduce((sum, it) => sum + it.unitPrice * it.qty, 0).toFixed(2);
  const totalQty = resolvedItems.reduce((sum, it) => sum + it.qty, 0);

  let appliedCoupon = null;
  let discountAmount = 0;
  let freeShippingByCoupon = false;

  if (req.body.couponCode && String(req.body.couponCode).trim()) {
    const cleanCode = String(req.body.couponCode).trim().toUpperCase();
    appliedCoupon = await Coupon.findOne({ code: cleanCode });
    const evalRes = evaluateCoupon(appliedCoupon, subtotal);
    discountAmount = evalRes.discountAmount;
    freeShippingByCoupon = evalRes.freeShipping;
  }

  const [storeSetting, shippingRuleDoc] = await Promise.all([
    StoreSetting.findOne({ key: 'general' }).lean(),
    ensureConfig('shipping-rules')
  ]);

  const shipSettings = shippingRuleDoc?.settings || {};
  const freeThreshold = Number(shipSettings.freeShippingThreshold ?? 75);
  const shippingMethod =
    req.body.shippingMethod && String(req.body.shippingMethod).trim()
      ? String(req.body.shippingMethod).trim()
      : 'Giao hàng tiêu chuẩn';

  let shippingFee = Number(shipSettings.standardFee ?? 5);
  const shipLower = shippingMethod.toLowerCase();
  if (shipLower.includes('dhl') || shipLower.includes('hỏa tốc')) {
    shippingFee = Number(shipSettings.dhlExpressFee ?? 15);
  } else if (shipLower.includes('ghtk') || shipLower.includes('ghn') || shipLower.includes('nhanh')) {
    shippingFee = Number(shipSettings.expressFee ?? 8);
  }

  if (freeShippingByCoupon || (subtotal >= freeThreshold && shippingFee <= 8)) {
    shippingFee = 0;
  }

  const taxRate = Number(storeSetting?.taxRate ?? 8);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = +((taxableAmount * taxRate) / 100).toFixed(2);
  const total = +(taxableAmount + shippingFee + taxAmount).toFixed(2);

  // 3. Trừ tồn kho trên cả Product & StockItem
  for (const entry of resolvedItems) {
    const { product, qty, unitPrice } = entry;
    product.inventory = Math.max(0, (product.inventory || 0) - qty);
    product.sales = (product.sales || 0) + qty;
    product.revenue = +((product.revenue || 0) + unitPrice * qty).toFixed(2);
    product.status = computeProductStatusFromInventory(product.inventory, product.status, 15);
    await product.save();

    const stockItem = await StockItem.findOne({
      $or: [{ productRef: product._id }, { sku: product.sku }]
    });
    if (stockItem) {
      let remaining = qty;
      for (const locField of ['locationNY', 'locationCA', 'locationTX']) {
        if (remaining <= 0) break;
        const availLoc = Number(stockItem[locField]) || 0;
        const deduct = Math.min(availLoc, remaining);
        stockItem[locField] = availLoc - deduct;
        remaining -= deduct;
      }
      stockItem.onHand = Math.max(
        0,
        (Number(stockItem.locationNY) || 0) +
          (Number(stockItem.locationCA) || 0) +
          (Number(stockItem.locationTX) || 0)
      );
      stockItem.available = Math.max(0, stockItem.onHand - (Number(stockItem.committed) || 0));
      stockItem.status = computeStockStatus(stockItem.available, stockItem.reorderPoint);
      await stockItem.save();
    }
  }

  if (appliedCoupon) {
    appliedCoupon.usageCount = (appliedCoupon.usageCount || 0) + 1;
    await appliedCoupon.save();
  }

  // 4. Upsert Customer & tạo Order + Transaction + Shipment + Notification
  const orderCode = await generateUniqueCode(Order, 'orderCode', 'SF');
  const avatar = makeAvatarInitials(customerName, 'KH');

  let customerDoc = await Customer.findOne({ email: customerEmail });
  if (customerDoc) {
    customerDoc.name = customerName;
    customerDoc.phone = customerPhone;
    customerDoc.location = fullAddress;
    customerDoc.ordersCount = (customerDoc.ordersCount || 0) + 1;
    customerDoc.totalSpent = +((customerDoc.totalSpent || 0) + total).toFixed(2);
    customerDoc.aov = +(customerDoc.totalSpent / customerDoc.ordersCount).toFixed(2);
    customerDoc.lastOrder = `Hôm nay (#${orderCode})`;
    if (customerDoc.totalSpent >= 1000 && customerDoc.ordersCount >= 5) {
      customerDoc.segment = 'Khách VIP';
    } else if (customerDoc.ordersCount >= 3 && customerDoc.segment === 'Khách mới') {
      customerDoc.segment = 'Khách quen';
    }
    await customerDoc.save();
  } else {
    customerDoc = await Customer.create({
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      avatar,
      segment: 'Khách mới',
      ordersCount: 1,
      totalSpent: total,
      aov: total,
      lastOrder: `Hôm nay (#${orderCode})`,
      location: fullAddress,
      marketing: 'Đã đăng ký',
      status: 'Active'
    });
  }

  const firstEntry = resolvedItems[0];
  const firstLabel = `${firstEntry.product.name}${firstEntry.variant ? ` (${firstEntry.variant})` : ''}${
    firstEntry.qty > 1 ? ` (x${firstEntry.qty})` : ''
  }`;
  const itemsDesc =
    resolvedItems.length === 1
      ? firstLabel
      : `${firstLabel} + ${resolvedItems.length - 1} sản phẩm khác`;

  const paymentMethod = req.body.paymentMethod ? String(req.body.paymentMethod).trim() : 'Stripe';
  const isCod =
    paymentMethod.toUpperCase().includes('COD') ||
    paymentMethod.toLowerCase().includes('nhận hàng');
  const paymentStatus = isCod ? 'Pending' : 'Paid';

  const order = await Order.create({
    orderCode,
    customerRef: customerDoc._id,
    customer: {
      name: customerName,
      email: customerEmail,
      avatar
    },
    date: formatViDate(),
    channel: 'Cửa hàng trực tuyến',
    itemsCount: totalQty,
    itemsDesc,
    total,
    paymentStatus,
    fulfillmentStatus: 'Processing',
    shippingMethod,
    address: fullAddress
  });

  const gateway = paymentMethod.includes('VNPay')
    ? 'VNPay QR'
    : paymentMethod.includes('MoMo')
    ? 'MoMo'
    : paymentMethod.includes('PayPal')
    ? 'PayPal'
    : isCod
    ? 'COD'
    : 'Stripe';

  const txnCode = await generateUniqueCode(Transaction, 'txnCode', 'TXN-');
  const fee = paymentStatus === 'Paid' ? +(total * 0.025).toFixed(2) : 0;
  const net = paymentStatus === 'Paid' ? +(total - fee).toFixed(2) : 0;

  const transaction = await Transaction.create({
    txnCode,
    orderId: orderCode,
    orderRef: order._id,
    customer: customerName,
    gateway,
    amount: total,
    fee,
    net,
    status: paymentStatus === 'Paid' ? 'Succeeded' : 'Pending',
    statusText: paymentStatus === 'Paid' ? 'Thành công' : 'Chờ thu hộ COD',
    statusClass: paymentStatus === 'Paid' ? 'green' : 'amber',
    date: `Hôm nay, ${formatViTime()}`,
    cardLast4: isCod ? 'COD' : '4242'
  });

  const carrier = shipLower.includes('dhl')
    ? 'DHL Express'
    : shipLower.includes('ghn')
    ? 'Giao Hàng Nhanh (GHN)'
    : shipLower.includes('viettel')
    ? 'Viettel Post'
    : 'Giao Hàng Tiết Kiệm (GHTK)';

  const trackingCode = await generateUniqueCode(Shipment, 'trackingCode', 'TRK-');
  const shipment = await Shipment.create({
    trackingCode,
    orderId: orderCode,
    orderRef: order._id,
    carrier,
    customer: customerName,
    destination: fullAddress,
    status: 'Pending',
    statusText: 'Chờ lấy hàng',
    statusClass: 'purple',
    createdAtLabel: `Hôm nay, ${formatViTime()}`,
    eta: shipLower.includes('dhl') ? 'Dự kiến ngày mai' : '2-3 ngày tới'
  });

  await Notification.create({
    title: `Đơn hàng mới #${orderCode}`,
    detail: `Khách hàng ${customerName} vừa đặt ${totalQty} sản phẩm ($${total.toFixed(2)}) trên Storefront.`,
    time: 'Vừa xong',
    unread: true,
    type: 'order'
  });

  return sendCreated(res, {
    order,
    shipment,
    transaction,
    pricing: {
      subtotal,
      discountAmount,
      shippingFee,
      taxRate,
      taxAmount,
      total
    }
  });
});

// ==========================================
// 3. ORDER TRACKING & CUSTOMER CANCELLATION
// ==========================================

export const lookupStoreOrder = asyncHandler(async (req, res) => {
  const rawCode = requireNonEmptyString(
    req.query.orderCode || req.query.id,
    'mã đơn hàng tra cứu (VD: SF83291)',
    'orderCode'
  );
  const cleanCode = rawCode.replace(/^#/, '').trim().toUpperCase();

  const order = await Order.findOne({
    orderCode: new RegExp(`^${escapeRegex(cleanCode)}$`, 'i')
  });

  if (!order) {
    throw new AppError(
      `Không tìm thấy đơn hàng #${cleanCode}. Vui lòng kiểm tra lại mã đơn hàng.`,
      404,
      'NOT_FOUND'
    );
  }

  if (req.query.email && String(req.query.email).trim()) {
    const queryEmail = String(req.query.email).trim().toLowerCase();
    if (order.customer?.email && order.customer.email.toLowerCase() !== queryEmail) {
      throw new AppError(
        'Địa chỉ email không khớp với thông tin đặt hàng của mã đơn này.',
        404,
        'EMAIL_MISMATCH'
      );
    }
  }

  const [shipment, transaction] = await Promise.all([
    Shipment.findOne({ $or: [{ orderRef: order._id }, { orderId: order.orderCode }] }),
    Transaction.findOne({ $or: [{ orderRef: order._id }, { orderId: order.orderCode }] })
  ]);

  return sendSuccess(res, {
    order,
    shipment,
    transaction
  });
});

export const getCustomerStoreOrders = asyncHandler(async (req, res) => {
  const email = requireValidEmail(req.query.email, 'email khách hàng', 'email');
  const orders = await Order.find({ 'customer.email': email }).sort({ createdAt: -1 });

  const orderCodes = orders.map((o) => o.orderCode);
  const shipments = await Shipment.find({ orderId: { $in: orderCodes } });
  const shipmentByOrder = new Map(shipments.map((s) => [s.orderId, s.toJSON()]));

  const enriched = orders.map((o) => ({
    ...o.toJSON(),
    shipment: shipmentByOrder.get(o.orderCode) || null
  }));

  return sendSuccess(res, enriched, { total: enriched.length });
});

export const cancelStoreOrder = asyncHandler(async (req, res) => {
  const order = await findByCodeOrId(Order, req.params.id, 'orderCode');
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng "${req.params.id}".`, 404, 'NOT_FOUND');
  }

  if (order.fulfillmentStatus !== 'Processing') {
    throw new AppError(
      'Chỉ có thể hủy đơn hàng khi đang ở trạng thái "Đang xử lý". Đơn hàng này đã được đóng gói hoặc bàn giao vận chuyển.',
      400,
      'CANNOT_CANCEL_ORDER'
    );
  }

  // Hoàn lại tồn kho cho sản phẩm chính trong mô tả đơn hàng
  const mainItemName = String(order.itemsDesc || '')
    .split('+')[0]
    .replace(/\(.*?\)/g, '')
    .trim();

  if (mainItemName) {
    const product = await Product.findOne({
      name: new RegExp(escapeRegex(mainItemName), 'i'),
      isDeleted: { $ne: true }
    });
    if (product) {
      const restoreQty = Math.max(1, Number(order.itemsCount) || 1);
      product.inventory = (product.inventory || 0) + restoreQty;
      product.status = computeProductStatusFromInventory(product.inventory, product.status, 15);
      await product.save();

      const stockItem = await StockItem.findOne({
        $or: [{ productRef: product._id }, { sku: product.sku }]
      });
      if (stockItem) {
        stockItem.locationNY = (Number(stockItem.locationNY) || 0) + restoreQty;
        stockItem.onHand = (Number(stockItem.onHand) || 0) + restoreQty;
        stockItem.available = Math.max(0, stockItem.onHand - (Number(stockItem.committed) || 0));
        stockItem.status = computeStockStatus(stockItem.available, stockItem.reorderPoint);
        await stockItem.save();
      }
    }
  }

  order.fulfillmentStatus = 'Cancelled';
  if (order.paymentStatus === 'Paid') {
    order.paymentStatus = 'Refunded';
  }
  await order.save();

  const [shipment, transaction] = await Promise.all([
    Shipment.findOne({ $or: [{ orderRef: order._id }, { orderId: order.orderCode }] }),
    Transaction.findOne({ $or: [{ orderRef: order._id }, { orderId: order.orderCode }] })
  ]);

  if (transaction && transaction.status === 'Succeeded') {
    transaction.status = 'Refunded';
    transaction.statusText = 'Đã hoàn tiền';
    transaction.statusClass = 'red';
    transaction.fee = 0;
    transaction.net = -Math.abs(Number(transaction.amount) || 0);
    await transaction.save();
  }

  await Notification.create({
    title: `Khách hàng hủy đơn #${order.orderCode}`,
    detail: `Đơn hàng #${order.orderCode} (${order.customer?.name}) đã được hủy và hoàn tồn kho tự động.`,
    time: 'Vừa xong',
    unread: true,
    type: 'warning'
  });

  return sendSuccess(res, { order, shipment, transaction });
});

// ==========================================
// 4. CUSTOMER ACCOUNT (SAFE DEMO AUTH)
// ==========================================

export const loginStoreCustomer = asyncHandler(async (req, res) => {
  const email = requireValidEmail(req.body.email, 'địa chỉ email đăng nhập', 'email');
  const customer = await Customer.findOne({ email });

  if (!customer) {
    throw new AppError(
      `Chưa tìm thấy tài khoản với email "${email}". Bạn có thể đăng ký tài khoản mới ngay bên cạnh!`,
      404,
      'CUSTOMER_NOT_FOUND'
    );
  }

  return sendSuccess(res, customer);
});

export const registerStoreCustomer = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'họ và tên', 'name');
  const email = requireValidEmail(req.body.email, 'địa chỉ email', 'email');

  if (await Customer.exists({ email })) {
    throw new AppError(
      `Email "${email}" đã có tài khoản tại Veylix. Vui lòng chuyển sang Đăng nhập!`,
      409,
      'CONFLICT'
    );
  }

  const customer = await Customer.create({
    name,
    email,
    phone: req.body.phone ? String(req.body.phone).trim() : '',
    avatar: makeAvatarInitials(name, 'KH'),
    segment: 'Khách mới',
    ordersCount: 0,
    totalSpent: 0,
    aov: 0,
    lastOrder: 'Chưa có đơn hàng',
    location:
      req.body.location && String(req.body.location).trim()
        ? String(req.body.location).trim()
        : 'TP. Hồ Chí Minh, Việt Nam',
    marketing: 'Đã đăng ký',
    status: 'Active'
  });

  return sendCreated(res, customer);
});

// ==========================================
// 5. SUBMIT PRODUCT REVIEW & LIVE CHAT
// ==========================================

export const createStoreReview = asyncHandler(async (req, res) => {
  const customerName = requireNonEmptyString(req.body.customerName, 'tên người đánh giá', 'customerName');
  const rating = Math.round(
    requireNumber(req.body.rating, 'Số sao đánh giá', { min: 1, max: 5, fieldName: 'rating' })
  );
  const title = requireNonEmptyString(req.body.title, 'tiêu đề nhận xét', 'title');
  const comment = requireNonEmptyString(req.body.comment, 'nội dung đánh giá chi tiết', 'comment');

  let product = null;
  if (req.body.productId) {
    const pid = String(req.body.productId).trim();
    product = mongoose.isValidObjectId(pid)
      ? await Product.findById(pid)
      : await Product.findOne({ sku: pid.toUpperCase() });
  }
  if (!product && req.body.productName) {
    product = await Product.findOne({
      name: new RegExp(`^${escapeRegex(String(req.body.productName).trim())}$`, 'i')
    });
  }

  const productName = product
    ? product.name
    : requireNonEmptyString(req.body.productName, 'tên sản phẩm đánh giá', 'productName');

  let customerDoc = null;
  if (req.body.customerEmail && String(req.body.customerEmail).trim()) {
    customerDoc = await Customer.findOne({
      email: String(req.body.customerEmail).trim().toLowerCase()
    });
  }

  const sentiment = rating >= 4 ? 'Positive' : rating === 3 ? 'Neutral' : 'Negative';

  const review = await Review.create({
    productRef: product ? product._id : null,
    customerRef: customerDoc ? customerDoc._id : null,
    productName,
    customerName,
    rating,
    title,
    comment,
    date: 'Vừa xong',
    status: 'Published',
    sentiment,
    verified: true,
    response: null
  });

  // Cập nhật lại điểm trung bình rating thực tế của sản phẩm
  if (product) {
    const publishedReviews = await Review.find({
      status: 'Published',
      $or: [{ productRef: product._id }, { productName: product.name }]
    })
      .select('rating')
      .lean();

    if (publishedReviews.length > 0) {
      const avg =
        publishedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
        publishedReviews.length;
      product.rating = +avg.toFixed(1);
      await product.save();
    }
  }

  await Notification.create({
    title: `Đánh giá ${rating} sao mới`,
    detail: `${customerName} vừa nhận xét sản phẩm "${productName}": "${title}"`,
    time: 'Vừa xong',
    unread: true,
    type: 'review'
  });

  return sendCreated(res, review);
});

export const getStoreChat = asyncHandler(async (req, res) => {
  const customerName = req.query.customer ? String(req.query.customer).trim() : '';
  const email = req.query.email ? String(req.query.email).trim().toLowerCase() : '';

  let conv = null;
  if (email) {
    const cust = await Customer.findOne({ email }).select('_id name').lean();
    if (cust) {
      conv = await Conversation.findOne({
        $or: [{ customerRef: cust._id }, { customer: new RegExp(`^${escapeRegex(cust.name)}$`, 'i') }]
      });
    }
  }
  if (!conv && customerName) {
    conv = await Conversation.findOne({
      customer: new RegExp(`^${escapeRegex(customerName)}$`, 'i')
    });
  }

  if (conv) {
    return sendSuccess(res, conv);
  }

  return sendSuccess(res, {
    id: null,
    customer: customerName || 'Khách tham quan',
    avatar: makeAvatarInitials(customerName || 'KH', 'KH'),
    unread: false,
    time: 'Trực tuyến',
    lastMessage: 'Xin chào! Veylix Studio có thể hỗ trợ gì cho bạn?',
    messages: [
      {
        sender: 'bot',
        text: 'Xin chào! Chào mừng bạn đến với Veylix Studio. Bạn cần tư vấn kích cỡ, chất liệu hay kiểm tra đơn hàng ạ?',
        time: formatViTime()
      }
    ]
  });
});

export const sendStoreChatMessage = asyncHandler(async (req, res) => {
  const customerName = requireNonEmptyString(req.body.customer, 'tên của bạn', 'customer');
  const text = requireNonEmptyString(req.body.text, 'nội dung tin nhắn', 'text');
  const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';

  let custDoc = null;
  if (email) {
    custDoc = await Customer.findOne({ email });
  }
  if (!custDoc) {
    custDoc = await Customer.findOne({
      name: new RegExp(`^${escapeRegex(customerName)}$`, 'i')
    });
  }

  let conv = null;
  if (custDoc) {
    conv = await Conversation.findOne({
      $or: [{ customerRef: custDoc._id }, { customer: new RegExp(`^${escapeRegex(customerName)}$`, 'i') }]
    });
  } else {
    conv = await Conversation.findOne({
      customer: new RegExp(`^${escapeRegex(customerName)}$`, 'i')
    });
  }

  const nowStr = formatViTime();
  if (conv) {
    conv.messages.push({
      sender: 'customer',
      text,
      time: nowStr
    });
    conv.lastMessage = text;
    conv.time = 'Vừa xong';
    conv.unread = true;
    await conv.save();
  } else {
    conv = await Conversation.create({
      customerRef: custDoc ? custDoc._id : null,
      customer: customerName,
      avatar: custDoc?.avatar || makeAvatarInitials(customerName, 'KH'),
      lastMessage: text,
      time: 'Vừa xong',
      unread: true,
      messages: [
        {
          sender: 'bot',
          text: `Xin chào ${customerName}! Cảm ơn bạn đã nhắn tin cho Veylix Studio, chuyên viên CSKH sẽ phản hồi ngay.`,
          time: nowStr
        },
        {
          sender: 'customer',
          text,
          time: nowStr
        }
      ]
    });
  }

  await Notification.create({
    title: `Tin nhắn CSKH từ ${customerName}`,
    detail: text.slice(0, 120),
    time: 'Vừa xong',
    unread: true,
    type: 'info'
  });

  return sendCreated(res, conv);
});
