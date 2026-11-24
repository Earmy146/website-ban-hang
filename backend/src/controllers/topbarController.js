import mongoose from 'mongoose';
import {
  Notification,
  Order,
  StockItem,
  Shipment,
  Product,
  Customer,
  StoreSetting
} from '../models/index.js';
import { getDbStatus } from '../config/db.js';
import { AppError, asyncHandler, sendSuccess } from '../utils/apiResponse.js';
import { escapeRegex } from '../utils/helpers.js';

const DEFAULT_USER = {
  name: 'Alex Chen',
  role: 'Quản trị viên cửa hàng',
  email: 'alex.chen@veylix.vn',
  avatarLetter: 'A'
};

function buildPeriodsFromBase(baseOrdersCount, baseRevenue) {
  const rev30 = Math.max(baseRevenue, 124592);
  const ord30 = Math.max(baseOrdersCount, 1248);
  const aov30 = ord30 > 0 ? rev30 / ord30 : 99.8;

  return [
    {
      id: '7',
      label: '7 ngày qua',
      range: '24 – 30 Tháng 4, 2026',
      sales: `$${Math.round(rev30 * 0.22).toLocaleString('en-US')}`,
      orders: Math.round(ord30 * 0.27),
      conversion: '3.50%',
      aov: `$${(aov30 * 0.82).toFixed(2)}`,
      change: '+8.4%'
    },
    {
      id: '30',
      label: '30 ngày qua',
      range: '1 – 30 Tháng 4, 2026',
      sales: `$${Math.round(rev30).toLocaleString('en-US')}`,
      orders: ord30,
      conversion: '3.42%',
      aov: `$${aov30.toFixed(2)}`,
      change: '+12.6%'
    },
    {
      id: '90',
      label: '90 ngày qua',
      range: '1 Tháng 2 – 30 Tháng 4, 2026',
      sales: `$${Math.round(rev30 * 2.95).toLocaleString('en-US')}`,
      orders: Math.round(ord30 * 3.06),
      conversion: '3.38%',
      aov: `$${(aov30 * 0.97).toFixed(2)}`,
      change: '+15.2%'
    },
    {
      id: '365',
      label: 'Từ đầu năm',
      range: '1 Tháng 1 – 30 Tháng 4, 2026',
      sales: `$${Math.round(rev30 * 4.12).toLocaleString('en-US')}`,
      orders: Math.round(ord30 * 4.16),
      conversion: '3.40%',
      aov: `$${(aov30 * 0.99).toFixed(2)}`,
      change: '+18.1%'
    }
  ];
}

export const getHealth = asyncHandler(async (_req, res) => {
  let dbInfo = { connected: mongoose.connection.readyState === 1, mode: 'mongodb' };
  try {
    const status = typeof getDbStatus === 'function' ? getDbStatus() : null;
    if (status) {
      dbInfo = {
        connected: Boolean(status.connected),
        mode: status.mode || 'mongodb'
      };
    }
  } catch (_err) {
    // Giữ fallback an toàn nếu dbStatus chưa sẵn sàng
  }

  return sendSuccess(res, {
    status: 'ok',
    db: dbInfo,
    timestamp: new Date().toISOString()
  });
});

export const getTopbarSummary = asyncHandler(async (_req, res) => {
  const [orders, lowStockCount, delayedCount, settings] = await Promise.all([
    Order.find({ fulfillmentStatus: { $ne: 'Cancelled' } }).select('total').lean(),
    StockItem.countDocuments({ status: { $in: ['Low', 'Out'] } }),
    Shipment.countDocuments({ status: 'Delayed' }),
    StoreSetting.findOne({ key: 'general' }).lean()
  ]);

  const ordersCount = orders.length;
  const totalRev = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const rawUser = settings?.currentUser || DEFAULT_USER;
  const currentUser = {
    name: rawUser.name || DEFAULT_USER.name,
    role: rawUser.role || DEFAULT_USER.role,
    email: rawUser.email || DEFAULT_USER.email,
    avatarLetter: rawUser.avatarLetter || (rawUser.name ? rawUser.name[0].toUpperCase() : 'A')
  };

  return sendSuccess(res, {
    ordersCount,
    lowStockCount,
    delayedCount,
    currentUser,
    periods: buildPeriodsFromBase(ordersCount, totalRev)
  });
});

export const getNotifications = asyncHandler(async (_req, res) => {
  const notifications = await Notification.find().sort({ createdAt: -1 });
  const unreadCount = notifications.filter((n) => n.unread).length;

  return sendSuccess(res, notifications, {
    total: notifications.length,
    unreadCount
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { $set: { unread: false } },
    { new: true }
  );

  if (!notification) {
    throw new AppError('Không tìm thấy thông báo cần đánh dấu đã đọc.', 404, 'NOT_FOUND');
  }

  return sendSuccess(res, notification);
});

export const markAllNotificationsRead = asyncHandler(async (_req, res) => {
  await Notification.updateMany({ unread: true }, { $set: { unread: false } });
  const notifications = await Notification.find().sort({ createdAt: -1 });

  return sendSuccess(res, notifications, {
    total: notifications.length,
    unreadCount: 0
  });
});

export const globalSearch = asyncHandler(async (req, res) => {
  const rawQuery = String(req.query.q || '').trim();
  const cleanQuery = rawQuery.replace(/^#/, '');

  let orders = [];
  let products = [];
  let customers = [];

  if (!cleanQuery) {
    [orders, products, customers] = await Promise.all([
      Order.find({ fulfillmentStatus: { $ne: 'Cancelled' } }).sort({ createdAt: -1 }).limit(4),
      Product.find({ isDeleted: { $ne: true } }).sort({ inventory: 1, sales: -1 }).limit(5),
      Customer.find().sort({ totalSpent: -1 }).limit(3)
    ]);
  } else {
    const rx = new RegExp(escapeRegex(cleanQuery), 'i');
    [orders, products, customers] = await Promise.all([
      Order.find({
        $or: [
          { orderCode: rx },
          { 'customer.name': rx },
          { 'customer.email': rx },
          { itemsDesc: rx }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(6),
      Product.find({
        isDeleted: { $ne: true },
        $or: [{ name: rx }, { sku: rx }, { category: rx }, { brand: rx }]
      })
        .sort({ sales: -1 })
        .limit(6),
      Customer.find({
        $or: [{ name: rx }, { email: rx }, { phone: rx }, { location: rx }]
      })
        .sort({ totalSpent: -1 })
        .limit(6)
    ]);
  }

  const results = [
    ...orders.map((o) => ({
      type: 'order',
      id: o.orderCode || o.id,
      title: `#${o.orderCode || o.id} · ${o.customer?.name || 'Khách hàng'}`,
      subtitle: `Đơn hàng · ${o.itemsCount || 1} sản phẩm · $${Number(o.total || 0).toFixed(2)}`,
      path: '/commerce/orders'
    })),
    ...products.map((p) => ({
      type: 'product',
      id: p.sku || p.id,
      title: p.name,
      subtitle:
        p.status === 'Low stock' || (p.inventory > 0 && p.inventory <= 15)
          ? `Sắp hết hàng · Còn ${p.inventory} chiếc`
          : `Sản phẩm · ${p.sku} · $${Number(p.price || 0).toFixed(2)}`,
      path:
        p.status === 'Low stock' || (p.inventory > 0 && p.inventory <= 15)
          ? '/commerce/stock'
          : '/commerce/products'
    })),
    ...customers.map((c) => ({
      type: 'customer',
      id: c.id,
      title: c.name,
      subtitle: `Khách hàng · ${c.email} · ${c.segment || 'Khách mới'}`,
      path: '/commerce/customers'
    }))
  ];

  return sendSuccess(res, results, {
    query: rawQuery,
    total: results.length
  });
});
