import mongoose from 'mongoose';
import { Order, Shipment, Customer, Transaction } from '../models/index.js';
import { AppError, asyncHandler, sendCreated, sendSuccess } from '../utils/apiResponse.js';
import {
  escapeRegex,
  findByCodeOrId,
  formatViDate,
  formatViTime,
  makeAvatarInitials,
  slugifyVi
} from '../utils/helpers.js';
import {
  optionalNumber,
  requireEnum,
  requireIdsArray,
  requireNonEmptyString,
  requireNumber
} from '../middleware/validate.js';

const VALID_PAYMENT_STATUSES = ['Paid', 'Pending', 'Refunded'];
const VALID_FULFILLMENT_STATUSES = ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
const VALID_SHIPMENT_STATUSES = ['Pending', 'Packaging', 'Out for delivery', 'Delivered', 'Delayed'];

async function generateUniqueOrderCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = `SF${Math.floor(10000 + Math.random() * 90000)}`;
    const exists = await Order.exists({ orderCode: code });
    if (!exists) return code;
  }
  return `SF${Date.now().toString().slice(-5)}`;
}

async function generateUniqueTrackingCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = `TRK-${Math.floor(10000 + Math.random() * 90000)}`;
    const exists = await Shipment.exists({ trackingCode: code });
    if (!exists) return code;
  }
  return `TRK-${Date.now().toString().slice(-5)}`;
}

async function generateUniqueTxnCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const exists = await Transaction.exists({ txnCode: code });
    if (!exists) return code;
  }
  return `TXN-${Date.now().toString().slice(-5)}`;
}

// ==========================================
// 1. ORDERS
// ==========================================

export const getOrders = asyncHandler(async (req, res) => {
  const { channel, paymentStatus, fulfillmentStatus, search, includeCancelled } = req.query;
  const filter = {};

  if (channel && channel !== 'all') {
    filter.channel = channel;
  }
  if (paymentStatus && paymentStatus !== 'all') {
    filter.paymentStatus = paymentStatus;
  }
  if (fulfillmentStatus && fulfillmentStatus !== 'all') {
    filter.fulfillmentStatus = fulfillmentStatus;
  } else if (includeCancelled !== 'true') {
    filter.fulfillmentStatus = { $ne: 'Cancelled' };
  }

  if (search && String(search).trim()) {
    const clean = String(search).trim().replace(/^#/, '');
    const rx = new RegExp(escapeRegex(clean), 'i');
    filter.$or = [
      { orderCode: rx },
      { 'customer.name': rx },
      { 'customer.email': rx },
      { itemsDesc: rx },
      { address: rx }
    ];
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, orders, { total: orders.length });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await findByCodeOrId(Order, req.params.id, 'orderCode');
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng "${req.params.id}".`, 404, 'NOT_FOUND');
  }
  return sendSuccess(res, order);
});

export const createOrder = asyncHandler(async (req, res) => {
  const rawName = req.body.customerName ?? req.body.customer?.name;
  const customerName = requireNonEmptyString(rawName, 'tên khách hàng', 'customerName');
  const total = requireNumber(req.body.total, 'Tổng giá trị đơn hàng', { min: 0.01, fieldName: 'total' });
  const itemsCount = Math.max(
    1,
    Math.round(optionalNumber(req.body.itemsCount, 1, { min: 1, fieldLabel: 'Số lượng sản phẩm', fieldName: 'itemsCount' }))
  );

  const rawEmail = req.body.customerEmail ?? req.body.customer?.email;
  const customerEmail =
    rawEmail && String(rawEmail).trim()
      ? String(rawEmail).trim().toLowerCase()
      : `${slugifyVi(customerName).replace(/-/g, '.')}@example.com`;

  const paymentStatus = req.body.paymentStatus
    ? requireEnum(req.body.paymentStatus, VALID_PAYMENT_STATUSES, 'Trạng thái thanh toán', 'paymentStatus')
    : 'Paid';

  const fulfillmentStatus = req.body.fulfillmentStatus
    ? requireEnum(req.body.fulfillmentStatus, VALID_FULFILLMENT_STATUSES, 'Trạng thái giao hàng', 'fulfillmentStatus')
    : 'Processing';

  const orderCode = await generateUniqueOrderCode();
  const avatar = makeAvatarInitials(customerName, 'KH');
  const address = req.body.address && String(req.body.address).trim()
    ? String(req.body.address).trim()
    : 'Quận 1, TP. Hồ Chí Minh';

  // Đồng bộ hoặc liên kết khách hàng theo email
  let customerDoc = await Customer.findOne({ email: customerEmail });
  if (customerDoc) {
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
      avatar,
      phone: '',
      segment: 'Khách mới',
      ordersCount: 1,
      totalSpent: +total.toFixed(2),
      aov: +total.toFixed(2),
      lastOrder: `Hôm nay (#${orderCode})`,
      location: address,
      marketing: 'Chưa đăng ký',
      status: 'Active'
    });
  }

  const order = await Order.create({
    orderCode,
    customerRef: customerDoc._id,
    customer: {
      name: customerName,
      email: customerEmail,
      avatar
    },
    date: req.body.date || formatViDate(),
    channel: req.body.channel && String(req.body.channel).trim()
      ? String(req.body.channel).trim()
      : 'Cửa hàng trực tuyến',
    itemsCount,
    itemsDesc: req.body.itemsDesc && String(req.body.itemsDesc).trim()
      ? String(req.body.itemsDesc).trim()
      : 'Đơn hàng tạo thủ công',
    total: +total.toFixed(2),
    paymentStatus,
    fulfillmentStatus,
    shippingMethod: req.body.shippingMethod && String(req.body.shippingMethod).trim()
      ? String(req.body.shippingMethod).trim()
      : 'Giao hàng tiêu chuẩn',
    address
  });

  // Tự động phát sinh bản ghi Transaction tương ứng cho đơn hàng mới
  const txnCode = await generateUniqueTxnCode();
  const isPaid = paymentStatus === 'Paid';
  const isRefunded = paymentStatus === 'Refunded';
  const fee = isPaid ? +(total * 0.029).toFixed(2) : 0;
  const net = isPaid ? +(total - fee).toFixed(2) : isRefunded ? -total : 0;

  await Transaction.create({
    txnCode,
    orderId: orderCode,
    orderRef: order._id,
    customer: customerName,
    gateway: 'Stripe',
    amount: +total.toFixed(2),
    fee,
    net,
    status: isPaid ? 'Succeeded' : isRefunded ? 'Refunded' : 'Pending',
    statusText: isPaid ? 'Thành công' : isRefunded ? 'Đã hoàn tiền' : 'Đang chờ xử lý',
    statusClass: isPaid ? 'green' : isRefunded ? 'red' : 'amber',
    date: `Hôm nay, ${formatViTime()}`,
    cardLast4: '4242'
  });

  return sendCreated(res, order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await findByCodeOrId(Order, req.params.id, 'orderCode');
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng "${req.params.id}".`, 404, 'NOT_FOUND');
  }

  const { paymentStatus, fulfillmentStatus } = req.body;
  if (paymentStatus === undefined && fulfillmentStatus === undefined) {
    throw new AppError(
      'Vui lòng cung cấp trạng thái thanh toán (paymentStatus) hoặc trạng thái giao hàng (fulfillmentStatus).',
      400,
      'VALIDATION_ERROR'
    );
  }

  if (paymentStatus !== undefined) {
    order.paymentStatus = requireEnum(paymentStatus, VALID_PAYMENT_STATUSES, 'Trạng thái thanh toán', 'paymentStatus');
  }
  if (fulfillmentStatus !== undefined) {
    order.fulfillmentStatus = requireEnum(
      fulfillmentStatus,
      VALID_FULFILLMENT_STATUSES,
      'Trạng thái giao hàng',
      'fulfillmentStatus'
    );
  }

  await order.save();

  // Đồng bộ Transaction liên kết nếu paymentStatus thay đổi
  if (paymentStatus !== undefined) {
    const txn = await Transaction.findOne({
      $or: [{ orderRef: order._id }, { orderId: order.orderCode }]
    });
    if (txn) {
      if (order.paymentStatus === 'Refunded') {
        txn.status = 'Refunded';
        txn.statusText = 'Đã hoàn tiền';
        txn.statusClass = 'red';
        txn.fee = 0;
        txn.net = -Math.abs(txn.amount);
      } else if (order.paymentStatus === 'Paid') {
        const fee = +(txn.amount * 0.029).toFixed(2);
        txn.status = 'Succeeded';
        txn.statusText = 'Thành công';
        txn.statusClass = 'green';
        txn.fee = fee;
        txn.net = +(txn.amount - fee).toFixed(2);
      } else {
        txn.status = 'Pending';
        txn.statusText = 'Đang chờ xử lý';
        txn.statusClass = 'amber';
        txn.fee = 0;
        txn.net = 0;
      }
      await txn.save();
    }
  }

  // Đồng bộ Shipment liên kết nếu fulfillmentStatus thay đổi
  if (fulfillmentStatus !== undefined) {
    const shipment = await Shipment.findOne({
      $or: [{ orderRef: order._id }, { orderId: order.orderCode }]
    });
    if (shipment) {
      if (order.fulfillmentStatus === 'Delivered') {
        shipment.status = 'Delivered';
        shipment.statusText = 'Đã giao thành công';
        shipment.statusClass = 'green';
        shipment.eta = 'Đã hoàn tất';
      } else if (order.fulfillmentStatus === 'Shipped') {
        shipment.status = 'Out for delivery';
        shipment.statusText = 'Đang giao hàng';
        shipment.statusClass = 'teal';
      } else if (order.fulfillmentStatus === 'Packed') {
        shipment.status = 'Packaging';
        shipment.statusText = 'Đang đóng gói';
        shipment.statusClass = 'amber';
      }
      await shipment.save();
    }
  }

  return sendSuccess(res, order);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await findByCodeOrId(Order, req.params.id, 'orderCode');
  if (!order) {
    throw new AppError(`Không tìm thấy đơn hàng "${req.params.id}" để hủy.`, 404, 'NOT_FOUND');
  }

  order.fulfillmentStatus = 'Cancelled';
  await order.save();

  return sendSuccess(res, order);
});

export const bulkCancelOrders = asyncHandler(async (req, res) => {
  const rawIds = requireIdsArray(req.body.ids, 'đơn hàng');
  const cleanCodes = rawIds.map((id) => id.replace(/^#/, ''));
  const validObjectIds = cleanCodes.filter((id) => mongoose.isValidObjectId(id));

  const query = validObjectIds.length > 0
    ? { $or: [{ orderCode: { $in: cleanCodes } }, { _id: { $in: validObjectIds } }] }
    : { orderCode: { $in: cleanCodes } };

  const result = await Order.updateMany(query, { $set: { fulfillmentStatus: 'Cancelled' } });

  return sendSuccess(res, {
    cancelledCount: result.modifiedCount,
    ids: cleanCodes
  });
});

// ==========================================
// 2. SHIPMENTS (FULFILLMENT)
// ==========================================

export const getShipments = asyncHandler(async (req, res) => {
  const { carrier, status, search } = req.query;
  const filter = {};

  if (carrier && carrier !== 'all') {
    filter.carrier = new RegExp(escapeRegex(String(carrier).trim()), 'i');
  }
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (search && String(search).trim()) {
    const clean = String(search).trim().replace(/^#/, '');
    const rx = new RegExp(escapeRegex(clean), 'i');
    filter.$or = [
      { trackingCode: rx },
      { orderId: rx },
      { customer: rx },
      { destination: rx },
      { carrier: rx }
    ];
  }

  const shipments = await Shipment.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, shipments, { total: shipments.length });
});

export const createShipment = asyncHandler(async (req, res) => {
  const rawOrderId = requireNonEmptyString(req.body.orderId, 'mã đơn hàng liên kết', 'orderId');
  const cleanOrderId = rawOrderId.replace(/^#/, '');
  const carrier = requireNonEmptyString(req.body.carrier, 'đơn vị vận chuyển', 'carrier');
  const destination = requireNonEmptyString(req.body.destination, 'địa chỉ giao hàng', 'destination');

  const linkedOrder = await findByCodeOrId(Order, cleanOrderId, 'orderCode');
  const customer =
    req.body.customer && String(req.body.customer).trim()
      ? String(req.body.customer).trim()
      : linkedOrder?.customer?.name || 'Khách nhận hàng';

  const status = req.body.status
    ? requireEnum(req.body.status, VALID_SHIPMENT_STATUSES, 'Trạng thái vận đơn', 'status')
    : 'Packaging';

  const statusMap = {
    Pending: { text: 'Chờ lấy hàng', cls: 'purple' },
    Packaging: { text: 'Đang đóng gói', cls: 'amber' },
    'Out for delivery': { text: 'Đang giao hàng', cls: 'teal' },
    Delivered: { text: 'Đã giao thành công', cls: 'green' },
    Delayed: { text: 'Chậm trễ giao', cls: 'red' }
  };

  const trackingCode = await generateUniqueTrackingCode();
  const shipment = await Shipment.create({
    trackingCode,
    orderId: linkedOrder ? linkedOrder.orderCode : cleanOrderId,
    orderRef: linkedOrder ? linkedOrder._id : null,
    carrier,
    customer,
    destination,
    status,
    statusText: statusMap[status].text,
    statusClass: statusMap[status].cls,
    createdAtLabel: 'Vừa tạo',
    eta: req.body.eta || '2-3 ngày tới'
  });

  if (linkedOrder && linkedOrder.fulfillmentStatus === 'Processing') {
    linkedOrder.fulfillmentStatus = 'Packed';
    await linkedOrder.save();
  }

  return sendCreated(res, shipment);
});

export const advanceShipment = asyncHandler(async (req, res) => {
  const shipment = await findByCodeOrId(Shipment, req.params.id, 'trackingCode');
  if (!shipment) {
    throw new AppError(`Không tìm thấy vận đơn "${req.params.id}".`, 404, 'NOT_FOUND');
  }

  let nextOrderStatus = null;
  if (shipment.status === 'Pending' || shipment.status === 'Delayed') {
    shipment.status = 'Packaging';
    shipment.statusText = 'Đang đóng gói';
    shipment.statusClass = 'amber';
    nextOrderStatus = 'Packed';
  } else if (shipment.status === 'Packaging') {
    shipment.status = 'Out for delivery';
    shipment.statusText = 'Đang giao hàng';
    shipment.statusClass = 'teal';
    nextOrderStatus = 'Shipped';
  } else if (shipment.status === 'Out for delivery') {
    shipment.status = 'Delivered';
    shipment.statusText = 'Đã giao thành công';
    shipment.statusClass = 'green';
    shipment.eta = 'Đã hoàn tất';
    nextOrderStatus = 'Delivered';
  }

  await shipment.save();

  if (nextOrderStatus) {
    const orderQuery = shipment.orderRef
      ? { $or: [{ _id: shipment.orderRef }, { orderCode: shipment.orderId }] }
      : { orderCode: shipment.orderId };
    await Order.updateOne(orderQuery, { $set: { fulfillmentStatus: nextOrderStatus } });
  }

  return sendSuccess(res, shipment);
});

export const bulkAdvanceShipments = asyncHandler(async (req, res) => {
  const rawIds = requireIdsArray(req.body.ids, 'vận đơn');
  const cleanCodes = rawIds.map((id) => id.replace(/^#/, ''));
  const validObjectIds = cleanCodes.filter((id) => mongoose.isValidObjectId(id));

  const query =
    validObjectIds.length > 0
      ? { $or: [{ trackingCode: { $in: cleanCodes } }, { _id: { $in: validObjectIds } }] }
      : { trackingCode: { $in: cleanCodes } };

  const shipments = await Shipment.find(query);
  let advancedCount = 0;
  const updatedIds = [];

  for (const shipment of shipments) {
    if (shipment.status === 'Delivered') continue;

    let nextOrderStatus = null;
    if (shipment.status === 'Pending' || shipment.status === 'Delayed') {
      shipment.status = 'Packaging';
      shipment.statusText = 'Đang đóng gói';
      shipment.statusClass = 'amber';
      nextOrderStatus = 'Packed';
    } else if (shipment.status === 'Packaging') {
      shipment.status = 'Out for delivery';
      shipment.statusText = 'Đang giao hàng';
      shipment.statusClass = 'teal';
      nextOrderStatus = 'Shipped';
    } else if (shipment.status === 'Out for delivery') {
      shipment.status = 'Delivered';
      shipment.statusText = 'Đã giao thành công';
      shipment.statusClass = 'green';
      shipment.eta = 'Đã hoàn tất';
      nextOrderStatus = 'Delivered';
    }

    await shipment.save();
    advancedCount += 1;
    updatedIds.push(shipment.trackingCode);

    if (nextOrderStatus) {
      const orderQuery = shipment.orderRef
        ? { $or: [{ _id: shipment.orderRef }, { orderCode: shipment.orderId }] }
        : { orderCode: shipment.orderId };
      await Order.updateOne(orderQuery, { $set: { fulfillmentStatus: nextOrderStatus } });
    }
  }

  const refreshedShipments = await Shipment.find().sort({ createdAt: -1 });
  return sendSuccess(
    res,
    {
      advancedCount,
      ids: updatedIds,
      shipments: refreshedShipments
    },
    { advancedCount }
  );
});
