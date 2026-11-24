import mongoose from 'mongoose';
import { StockItem, Product } from '../models/index.js';
import { AppError, asyncHandler, sendSuccess } from '../utils/apiResponse.js';
import {
  computeProductStatusFromInventory,
  computeStockStatus,
  escapeRegex,
  findByCodeOrId
} from '../utils/helpers.js';
import {
  requireEnum,
  requireNonEmptyString,
  requireNumber
} from '../middleware/validate.js';

const LOCATION_MAP = {
  NY: 'locationNY',
  CA: 'locationCA',
  TX: 'locationTX'
};
const VALID_LOCATIONS = ['NY', 'CA', 'TX'];

export async function syncProductInventoryFromStock(stockItem) {
  const query = stockItem.productRef
    ? { $or: [{ _id: stockItem.productRef }, { sku: stockItem.sku }] }
    : { sku: stockItem.sku };

  const product = await Product.findOne(query);
  if (!product) return null;

  product.inventory = stockItem.onHand;
  product.maxInventory = Math.max(product.maxInventory || 100, stockItem.onHand);
  product.status = computeProductStatusFromInventory(
    stockItem.onHand,
    product.status,
    stockItem.reorderPoint ?? 15
  );
  await product.save();
  return product;
}

export const getStock = asyncHandler(async (req, res) => {
  const { status, category, search } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }
  if (category && category !== 'all') {
    filter.category = category;
  }
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { category: rx }, { brand: rx }];
  }

  const stockItems = await StockItem.find(filter).sort({ available: 1, name: 1 });
  return sendSuccess(res, stockItems, { total: stockItems.length });
});

export const transferStock = asyncHandler(async (req, res) => {
  const sku = requireNonEmptyString(req.body.sku, 'mã sản phẩm (SKU)', 'sku').toUpperCase();
  const fromLoc = requireEnum(req.body.fromLoc, VALID_LOCATIONS, 'Kho xuất', 'fromLoc');
  const toLoc = requireEnum(req.body.toLoc, VALID_LOCATIONS, 'Kho nhận', 'toLoc');
  const quantity = Math.round(
    requireNumber(req.body.quantity, 'Số lượng điều chuyển', { min: 1, fieldName: 'quantity' })
  );

  if (fromLoc === toLoc) {
    throw new AppError('Kho xuất và kho nhận không được trùng nhau.', 400, 'VALIDATION_ERROR', [
      { field: 'toLoc', message: 'Kho nhận phải khác kho xuất' }
    ]);
  }

  const stockItem = await StockItem.findOne({ sku });
  if (!stockItem) {
    throw new AppError(`Không tìm thấy mặt hàng tồn kho với mã SKU "${sku}".`, 404, 'NOT_FOUND');
  }

  const fromKey = LOCATION_MAP[fromLoc];
  const toKey = LOCATION_MAP[toLoc];
  const currentFromQty = Number(stockItem[fromKey]) || 0;

  if (currentFromQty < quantity) {
    throw new AppError(
      `Kho ${fromLoc} không đủ hàng để điều chuyển (hiện có ${currentFromQty}, yêu cầu chuyển ${quantity}).`,
      400,
      'INSUFFICIENT_STOCK',
      [{ field: 'quantity', message: `Tồn kho tại ${fromLoc} chỉ còn ${currentFromQty}` }]
    );
  }

  stockItem[fromKey] = currentFromQty - quantity;
  stockItem[toKey] = (Number(stockItem[toKey]) || 0) + quantity;
  stockItem.onHand =
    (Number(stockItem.locationNY) || 0) +
    (Number(stockItem.locationCA) || 0) +
    (Number(stockItem.locationTX) || 0);
  stockItem.available = Math.max(0, stockItem.onHand - (Number(stockItem.committed) || 0));
  stockItem.status = computeStockStatus(stockItem.available, stockItem.reorderPoint);

  await stockItem.save();
  await syncProductInventoryFromStock(stockItem);

  return sendSuccess(res, stockItem);
});

export const bulkTransferStock = asyncHandler(async (req, res) => {
  const fromLoc = requireEnum(req.body.fromLoc, VALID_LOCATIONS, 'Kho xuất', 'fromLoc');
  const toLoc = requireEnum(req.body.toLoc, VALID_LOCATIONS, 'Kho nhận', 'toLoc');

  if (fromLoc === toLoc) {
    throw new AppError('Kho xuất và kho nhận không được trùng nhau.', 400, 'VALIDATION_ERROR', [
      { field: 'toLoc', message: 'Kho nhận phải khác kho xuất' }
    ]);
  }

  const defaultQty =
    req.body.quantity !== undefined && req.body.quantity !== ''
      ? Math.round(requireNumber(req.body.quantity, 'Số lượng điều chuyển mỗi mã', { min: 1, fieldName: 'quantity' }))
      : 5;

  // Hỗ trợ linh hoạt cả { skus: [...] }, { items: [{ sku, id, quantity }] }, hoặc { ids: [...] }
  let entries = [];
  if (Array.isArray(req.body.items) && req.body.items.length > 0) {
    entries = req.body.items.map((it) => ({
      ref: String(it.sku || it.id || '').trim(),
      qty: Math.max(1, Math.round(Number(it.quantity) || defaultQty))
    }));
  } else if (Array.isArray(req.body.skus) && req.body.skus.length > 0) {
    entries = req.body.skus.map((sku) => ({
      ref: String(sku).trim(),
      qty: defaultQty
    }));
  } else if (Array.isArray(req.body.ids) && req.body.ids.length > 0) {
    entries = req.body.ids.map((id) => ({
      ref: String(id).trim(),
      qty: defaultQty
    }));
  }

  entries = entries.filter((e) => Boolean(e.ref));
  if (entries.length === 0) {
    throw new AppError('Vui lòng chọn ít nhất một mặt hàng (SKU) để chuyển kho hàng loạt.', 400, 'VALIDATION_ERROR');
  }

  const fromKey = LOCATION_MAP[fromLoc];
  const toKey = LOCATION_MAP[toLoc];
  const updatedItems = [];

  for (const entry of entries) {
    const query = mongoose.isValidObjectId(entry.ref)
      ? { $or: [{ _id: entry.ref }, { sku: entry.ref.toUpperCase() }] }
      : { sku: entry.ref.toUpperCase() };

    const stockItem = await StockItem.findOne(query);
    if (!stockItem) {
      throw new AppError(`Không tìm thấy mặt hàng tồn kho "${entry.ref}".`, 404, 'NOT_FOUND');
    }

    const availableAtSource = Number(stockItem[fromKey]) || 0;
    if (availableAtSource < entry.qty) {
      throw new AppError(
        `Mặt hàng ${stockItem.sku} tại kho ${fromLoc} chỉ còn ${availableAtSource} đơn vị (yêu cầu chuyển ${entry.qty}).`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    stockItem[fromKey] = availableAtSource - entry.qty;
    stockItem[toKey] = (Number(stockItem[toKey]) || 0) + entry.qty;
    stockItem.onHand =
      (Number(stockItem.locationNY) || 0) +
      (Number(stockItem.locationCA) || 0) +
      (Number(stockItem.locationTX) || 0);
    stockItem.available = Math.max(0, stockItem.onHand - (Number(stockItem.committed) || 0));
    stockItem.status = computeStockStatus(stockItem.available, stockItem.reorderPoint);

    await stockItem.save();
    await syncProductInventoryFromStock(stockItem);
    updatedItems.push(stockItem);
  }

  const allStock = await StockItem.find().sort({ available: 1, name: 1 });
  return sendSuccess(res, allStock, {
    transferredCount: updatedItems.length,
    updatedSkus: updatedItems.map((i) => i.sku)
  });
});

export const receiveStock = asyncHandler(async (req, res) => {
  const sku = requireNonEmptyString(req.body.sku, 'mã sản phẩm (SKU)', 'sku').toUpperCase();
  const targetLoc = requireEnum(req.body.targetLoc, VALID_LOCATIONS, 'Kho nhập hàng', 'targetLoc');
  const quantity = Math.round(
    requireNumber(req.body.quantity, 'Số lượng nhập kho', { min: 1, fieldName: 'quantity' })
  );

  const stockItem = await StockItem.findOne({ sku });
  if (!stockItem) {
    throw new AppError(`Không tìm thấy mặt hàng tồn kho với mã SKU "${sku}".`, 404, 'NOT_FOUND');
  }

  const locKey = LOCATION_MAP[targetLoc];
  stockItem[locKey] = (Number(stockItem[locKey]) || 0) + quantity;
  stockItem.onHand = (Number(stockItem.onHand) || 0) + quantity;
  stockItem.available = Math.max(0, stockItem.onHand - (Number(stockItem.committed) || 0));
  stockItem.status = computeStockStatus(stockItem.available, stockItem.reorderPoint);

  await stockItem.save();
  await syncProductInventoryFromStock(stockItem);

  return sendSuccess(res, stockItem);
});

export const adjustStock = asyncHandler(async (req, res) => {
  const stockItem = await findByCodeOrId(StockItem, req.params.id, 'sku');
  if (!stockItem) {
    throw new AppError('Không tìm thấy bản ghi tồn kho cần điều chỉnh.', 404, 'NOT_FOUND');
  }

  const onHand = Math.round(
    requireNumber(req.body.onHand, 'Số lượng tồn thực tế (onHand)', { min: 0, fieldName: 'onHand' })
  );
  const reorderPoint = Math.round(
    requireNumber(req.body.reorderPoint, 'Ngưỡng cảnh báo đặt hàng (reorderPoint)', {
      min: 0,
      fieldName: 'reorderPoint'
    })
  );

  const prevTotal =
    (Number(stockItem.locationNY) || 0) +
    (Number(stockItem.locationCA) || 0) +
    (Number(stockItem.locationTX) || 0);

  if (prevTotal > 0 && onHand > 0) {
    const ny = Math.round(((Number(stockItem.locationNY) || 0) / prevTotal) * onHand);
    const ca = Math.round(((Number(stockItem.locationCA) || 0) / prevTotal) * onHand);
    const tx = Math.max(0, onHand - ny - ca);
    stockItem.locationNY = ny;
    stockItem.locationCA = ca;
    stockItem.locationTX = tx;
  } else {
    const ny = Math.ceil(onHand * 0.55);
    const ca = Math.floor(onHand * 0.3);
    const tx = Math.max(0, onHand - ny - ca);
    stockItem.locationNY = ny;
    stockItem.locationCA = ca;
    stockItem.locationTX = tx;
  }

  stockItem.onHand = onHand;
  stockItem.reorderPoint = reorderPoint;
  stockItem.available = Math.max(0, onHand - (Number(stockItem.committed) || 0));
  stockItem.status = computeStockStatus(stockItem.available, reorderPoint);

  await stockItem.save();
  await syncProductInventoryFromStock(stockItem);

  return sendSuccess(res, stockItem);
});
