import { Product, Category, Brand, StockItem } from '../models/index.js';
import { AppError, asyncHandler, sendCreated, sendSuccess } from '../utils/apiResponse.js';
import {
  computeProductStatusFromInventory,
  computeStockStatus,
  escapeRegex,
  slugifyVi
} from '../utils/helpers.js';
import {
  optionalNumber,
  requireEnum,
  requireIdsArray,
  requireNonEmptyString,
  requireNumber
} from '../middleware/validate.js';

const VALID_PRODUCT_STATUSES = ['Active', 'Low stock', 'Out of stock', 'Draft', 'Archived'];
const VALID_CATEGORY_STATUSES = ['Active', 'Hidden'];
const VALID_BRAND_STATUSES = ['Active', 'Inactive'];

const LEGACY_IMAGE_MAP = {
  '/assets/images/products/canvas-tote.png': '/assets/images/products/canvas-tote-bag.png',
  '/assets/images/products/leather-passport.png': '/assets/images/products/travel-pouch.png',
  '/assets/images/products/desk-tray.png': '/assets/images/products/desk-organizer.png',
  '/assets/images/products/card-holder.png': '/assets/images/products/stoneware-bowl.png'
};

function normalizeProductImage(img) {
  if (!img || typeof img !== 'string' || !img.trim()) {
    return '/assets/images/products/everyday-tee.png';
  }
  const trimmed = img.trim();
  return LEGACY_IMAGE_MAP[trimmed] || trimmed;
}

async function syncStockForProduct(product) {
  const onHand = Math.max(0, Number(product.inventory) || 0);
  const existingStock = await StockItem.findOne({
    $or: [{ productRef: product._id }, { sku: product.sku }]
  });

  if (existingStock) {
    const reorderPoint = existingStock.reorderPoint ?? 15;
    const committed = existingStock.committed ?? 0;
    const available = Math.max(0, onHand - committed);
    const currentLocSum =
      (existingStock.locationNY || 0) +
      (existingStock.locationCA || 0) +
      (existingStock.locationTX || 0);

    if (currentLocSum !== onHand) {
      const ny = Math.ceil(onHand * 0.55);
      const ca = Math.floor(onHand * 0.3);
      const tx = Math.max(0, onHand - ny - ca);
      existingStock.locationNY = ny;
      existingStock.locationCA = ca;
      existingStock.locationTX = tx;
    }

    existingStock.productRef = product._id;
    existingStock.name = product.name;
    existingStock.category = product.category;
    existingStock.brand = product.brand;
    existingStock.sku = product.sku;
    existingStock.onHand = onHand;
    existingStock.available = available;
    existingStock.status = computeStockStatus(available, reorderPoint);
    existingStock.retailPrice = product.price;
    if (!existingStock.costPrice) {
      existingStock.costPrice = +(product.price * 0.35).toFixed(2);
    }
    await existingStock.save();
    return existingStock;
  }

  const ny = Math.ceil(onHand * 0.55);
  const ca = Math.floor(onHand * 0.3);
  const tx = Math.max(0, onHand - ny - ca);
  const reorderPoint = 15;

  return StockItem.create({
    productRef: product._id,
    name: product.name,
    category: product.category,
    brand: product.brand || 'Veylix Studio',
    sku: product.sku,
    onHand,
    committed: 0,
    incoming: 0,
    available: onHand,
    reorderPoint,
    locationNY: ny,
    locationCA: ca,
    locationTX: tx,
    status: computeStockStatus(onHand, reorderPoint),
    costPrice: +(Number(product.price || 0) * 0.35).toFixed(2),
    retailPrice: Number(product.price || 0)
  });
}

async function generateUniqueSku(basePrefix = 'VX') {
  for (let i = 0; i < 15; i += 1) {
    const candidate = `${basePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await Product.exists({ sku: candidate });
    if (!exists) return candidate;
  }
  return `${basePrefix}-${Date.now().toString().slice(-5)}`;
}

// ==========================================
// 1. PRODUCTS
// ==========================================

export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, status, includeDeleted, onlyDeleted } = req.query;
  const filter = {};

  if (onlyDeleted === 'true') {
    filter.isDeleted = true;
  } else if (includeDeleted !== 'true') {
    filter.isDeleted = { $ne: true };
  }

  if (category && category !== 'all') {
    filter.category = category;
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { brand: rx }, { category: rx }];
  }

  const products = await Product.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, products, {
    total: products.length,
    includeDeleted: includeDeleted === 'true'
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'tên sản phẩm', 'name');
  const price = requireNumber(req.body.price, 'Giá bán sản phẩm', { min: 0, fieldName: 'price' });
  const inventory = Math.round(
    optionalNumber(req.body.inventory, 50, { min: 0, fieldLabel: 'Số lượng tồn kho', fieldName: 'inventory' })
  );

  const categoryName = (req.body.category && String(req.body.category).trim()) || 'Thời trang & May mặc';
  const brandName = (req.body.brand && String(req.body.brand).trim()) || 'Veylix Studio';
  const rawSku = req.body.sku ? String(req.body.sku).trim().toUpperCase() : '';
  const sku = rawSku || (await generateUniqueSku('VX'));

  if (await Product.exists({ sku })) {
    throw new AppError(
      `Mã sản phẩm (SKU) "${sku}" đã tồn tại trong hệ thống. Vui lòng chọn mã SKU khác.`,
      409,
      'CONFLICT',
      [{ field: 'sku', message: 'Mã SKU bị trùng lặp' }]
    );
  }

  let status = computeProductStatusFromInventory(inventory, 'Active', 15);
  if (req.body.status) {
    status = requireEnum(req.body.status, VALID_PRODUCT_STATUSES, 'Trạng thái sản phẩm', 'status');
  }

  const [catDoc, brandDoc] = await Promise.all([
    Category.findOne({ name: categoryName }),
    Brand.findOne({ name: brandName })
  ]);

  const product = await Product.create({
    name,
    sku,
    category: categoryName,
    categoryRef: catDoc ? catDoc._id : null,
    brand: brandName,
    brandRef: brandDoc ? brandDoc._id : null,
    status,
    inventory,
    maxInventory: Math.max(100, inventory),
    sales: Number(req.body.sales) || 0,
    revenue: Number(req.body.revenue) || 0,
    trend: req.body.trend || '+0.0%',
    trendUp: req.body.trendUp !== undefined ? Boolean(req.body.trendUp) : true,
    rating: optionalNumber(req.body.rating, 5.0, { min: 0, max: 5, fieldLabel: 'Điểm đánh giá', fieldName: 'rating' }),
    date: req.body.date || 'Vừa xong',
    image: normalizeProductImage(req.body.image),
    price,
    desc: req.body.desc ? String(req.body.desc).trim() : 'Mô tả sản phẩm chuẩn Veylix.',
    isDeleted: false
  });

  await syncStockForProduct(product);

  if (catDoc) {
    await Category.updateOne({ _id: catDoc._id }, { $inc: { count: 1 } });
  }
  if (brandDoc) {
    await Brand.updateOne({ _id: brandDoc._id }, { $inc: { productsCount: 1 } });
  }

  return sendCreated(res, product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm cần cập nhật.', 404, 'NOT_FOUND');
  }

  if (req.body.name !== undefined) {
    product.name = requireNonEmptyString(req.body.name, 'tên sản phẩm', 'name');
  }
  if (req.body.sku !== undefined) {
    const nextSku = requireNonEmptyString(req.body.sku, 'mã SKU', 'sku').toUpperCase();
    if (nextSku !== product.sku && (await Product.exists({ sku: nextSku, _id: { $ne: product._id } }))) {
      throw new AppError(
        `Mã sản phẩm (SKU) "${nextSku}" đã tồn tại trong hệ thống.`,
        409,
        'CONFLICT',
        [{ field: 'sku', message: 'Mã SKU bị trùng lặp' }]
      );
    }
    product.sku = nextSku;
  }
  if (req.body.price !== undefined) {
    product.price = requireNumber(req.body.price, 'Giá bán sản phẩm', { min: 0, fieldName: 'price' });
  }
  if (req.body.inventory !== undefined) {
    product.inventory = Math.round(
      requireNumber(req.body.inventory, 'Số lượng tồn kho', { min: 0, fieldName: 'inventory' })
    );
    product.maxInventory = Math.max(product.maxInventory || 100, product.inventory);
  }
  if (req.body.category !== undefined) {
    product.category = requireNonEmptyString(req.body.category, 'danh mục sản phẩm', 'category');
    const catDoc = await Category.findOne({ name: product.category });
    product.categoryRef = catDoc ? catDoc._id : null;
  }
  if (req.body.brand !== undefined) {
    product.brand = requireNonEmptyString(req.body.brand, 'thương hiệu', 'brand');
    const brandDoc = await Brand.findOne({ name: product.brand });
    product.brandRef = brandDoc ? brandDoc._id : null;
  }
  if (req.body.desc !== undefined) {
    product.desc = String(req.body.desc).trim();
  }
  if (req.body.image !== undefined) {
    product.image = normalizeProductImage(req.body.image);
  }
  if (req.body.isDeleted !== undefined) {
    product.isDeleted = Boolean(req.body.isDeleted);
  }

  if (req.body.status !== undefined) {
    product.status = requireEnum(req.body.status, VALID_PRODUCT_STATUSES, 'Trạng thái sản phẩm', 'status');
  } else if (req.body.inventory !== undefined) {
    product.status = computeProductStatusFromInventory(product.inventory, product.status, 15);
  }

  await product.save();
  await syncStockForProduct(product);

  return sendSuccess(res, product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new AppError('Không tìm thấy sản phẩm cần xóa.', 404, 'NOT_FOUND');
  }

  product.isDeleted = true;
  await product.save();

  return sendSuccess(res, product);
});

export const duplicateProduct = asyncHandler(async (req, res) => {
  const source = await Product.findById(req.params.id);
  if (!source) {
    throw new AppError('Không tìm thấy sản phẩm gốc để nhân bản.', 404, 'NOT_FOUND');
  }

  let newSku = `${source.sku}-CP`;
  let suffix = 2;
  while (await Product.exists({ sku: newSku })) {
    newSku = `${source.sku}-CP${suffix}`;
    suffix += 1;
  }

  const duplicated = await Product.create({
    name: `${source.name} (Bản sao)`,
    sku: newSku,
    category: source.category,
    categoryRef: source.categoryRef,
    brand: source.brand,
    brandRef: source.brandRef,
    status: source.status,
    inventory: source.inventory,
    maxInventory: source.maxInventory || Math.max(100, source.inventory),
    sales: 0,
    revenue: 0,
    trend: '+0.0%',
    trendUp: true,
    rating: source.rating || 5.0,
    date: 'Vừa xong',
    image: normalizeProductImage(source.image),
    price: source.price,
    desc: source.desc,
    isDeleted: false
  });

  await syncStockForProduct(duplicated);

  return sendCreated(res, duplicated);
});

export const bulkArchiveProducts = asyncHandler(async (req, res) => {
  const ids = requireIdsArray(req.body.ids, 'sản phẩm');
  const result = await Product.updateMany(
    { _id: { $in: ids } },
    { $set: { isDeleted: true } }
  );

  return sendSuccess(res, {
    archivedCount: result.modifiedCount,
    ids
  });
});

export const importProducts = asyncHandler(async (req, res) => {
  const rawList = req.body.products;
  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new AppError('Danh sách sản phẩm nhập vào (products) không hợp lệ hoặc đang trống.', 400, 'VALIDATION_ERROR');
  }

  const createdItems = [];
  for (const item of rawList) {
    const name = requireNonEmptyString(item.name, 'tên sản phẩm nhập CSV', 'name');
    const price = requireNumber(item.price, `Giá bán của "${name}"`, { min: 0, fieldName: 'price' });
    const inventory = Math.round(
      optionalNumber(item.inventory, 50, { min: 0, fieldLabel: 'Tồn kho', fieldName: 'inventory' })
    );

    let sku = item.sku ? String(item.sku).trim().toUpperCase() : await generateUniqueSku('VX');
    if (await Product.exists({ sku })) {
      sku = `${sku}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const categoryName = (item.category && String(item.category).trim()) || 'Phụ kiện thời trang';
    const brandName = (item.brand && String(item.brand).trim()) || 'Veylix Studio';
    const [catDoc, brandDoc] = await Promise.all([
      Category.findOne({ name: categoryName }),
      Brand.findOne({ name: brandName })
    ]);

    const status =
      item.status && VALID_PRODUCT_STATUSES.includes(item.status)
        ? item.status
        : computeProductStatusFromInventory(inventory, 'Active', 15);

    const created = await Product.create({
      name,
      sku,
      category: categoryName,
      categoryRef: catDoc ? catDoc._id : null,
      brand: brandName,
      brandRef: brandDoc ? brandDoc._id : null,
      status,
      inventory,
      maxInventory: Math.max(Number(item.maxInventory) || 100, inventory),
      sales: Number(item.sales) || 0,
      revenue: Number(item.revenue) || 0,
      trend: item.trend || '+0.0%',
      trendUp: item.trendUp !== undefined ? Boolean(item.trendUp) : true,
      rating: optionalNumber(item.rating, 4.8, { min: 0, max: 5 }),
      date: item.date || 'Vừa xong',
      image: normalizeProductImage(item.image),
      price,
      desc: item.desc ? String(item.desc).trim() : 'Sản phẩm nhập khẩu từ tệp CSV.',
      isDeleted: false
    });

    await syncStockForProduct(created);
    createdItems.push(created);
  }

  return sendCreated(res, createdItems, { importedCount: createdItems.length });
});

// ==========================================
// 2. CATEGORIES
// ==========================================

export const getCategories = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: rx }, { slug: rx }];
  }

  const categories = await Category.find(filter).sort({ sortOrder: 1, createdAt: 1 });
  return sendSuccess(res, categories, { total: categories.length });
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'tên danh mục', 'name');
  const slug = req.body.slug && String(req.body.slug).trim()
    ? slugifyVi(req.body.slug)
    : slugifyVi(name);

  if (await Category.exists({ $or: [{ name }, { slug }] })) {
    throw new AppError(
      `Danh mục "${name}" hoặc đường dẫn "/${slug}" đã tồn tại trong hệ thống.`,
      409,
      'CONFLICT',
      [{ field: 'name', message: 'Tên hoặc đường dẫn danh mục bị trùng lặp' }]
    );
  }
  const status = req.body.status
    ? requireEnum(req.body.status, VALID_CATEGORY_STATUSES, 'Trạng thái danh mục', 'status')
    : 'Active';

  let sortOrder = req.body.sortOrder !== undefined ? Number(req.body.sortOrder) : undefined;
  if (!Number.isFinite(sortOrder)) {
    const lastCat = await Category.findOne().sort({ sortOrder: -1 }).select('sortOrder').lean();
    sortOrder = (lastCat?.sortOrder || 0) + 1;
  }

  const category = await Category.create({
    name,
    slug,
    icon: req.body.icon && String(req.body.icon).trim() ? String(req.body.icon).trim() : '📦',
    count: Number(req.body.count) || 0,
    status,
    sortOrder
  });

  return sendCreated(res, category);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục cần chỉnh sửa.', 404, 'NOT_FOUND');
  }

  const oldName = category.name;
  if (req.body.name !== undefined) {
    category.name = requireNonEmptyString(req.body.name, 'tên danh mục', 'name');
  }
  if (req.body.slug !== undefined && String(req.body.slug).trim()) {
    category.slug = slugifyVi(req.body.slug);
  }
  if (req.body.icon !== undefined && String(req.body.icon).trim()) {
    category.icon = String(req.body.icon).trim();
  }
  if (req.body.status !== undefined) {
    category.status = requireEnum(req.body.status, VALID_CATEGORY_STATUSES, 'Trạng thái danh mục', 'status');
  }
  if (req.body.sortOrder !== undefined) {
    category.sortOrder = requireNumber(req.body.sortOrder, 'Thứ tự hiển thị', { min: 0, fieldName: 'sortOrder' });
  }

  await category.save();

  if (oldName !== category.name) {
    await Product.updateMany(
      { $or: [{ categoryRef: category._id }, { category: oldName }] },
      { $set: { category: category.name } }
    );
  }

  return sendSuccess(res, category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    throw new AppError('Không tìm thấy danh mục cần xóa.', 404, 'NOT_FOUND');
  }

  await Product.updateMany(
    { $or: [{ categoryRef: category._id }, { category: category.name }] },
    { $set: { category: 'Chưa phân loại', categoryRef: null } }
  );

  return sendSuccess(res, { id: category.id, deleted: true });
});

// ==========================================
// 3. BRANDS
// ==========================================

export const getBrands = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: rx }, { origin: rx }];
  }

  const brands = await Brand.find(filter).sort({ revenue: -1, createdAt: 1 });
  return sendSuccess(res, brands, { total: brands.length });
});

export const createBrand = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'tên thương hiệu', 'name');
  if (await Brand.exists({ name })) {
    throw new AppError(
      `Thương hiệu "${name}" đã tồn tại trong hệ thống.`,
      409,
      'CONFLICT',
      [{ field: 'name', message: 'Tên thương hiệu bị trùng lặp' }]
    );
  }
  const status = req.body.status
    ? requireEnum(req.body.status, VALID_BRAND_STATUSES, 'Trạng thái thương hiệu', 'status')
    : 'Active';

  const brand = await Brand.create({
    name,
    origin: req.body.origin && String(req.body.origin).trim() ? String(req.body.origin).trim() : 'Việt Nam',
    productsCount: optionalNumber(req.body.productsCount, 0, { min: 0 }),
    revenue: optionalNumber(req.body.revenue, 0, { min: 0 }),
    status
  });

  return sendCreated(res, brand);
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    throw new AppError('Không tìm thấy thương hiệu cần chỉnh sửa.', 404, 'NOT_FOUND');
  }

  const oldName = brand.name;
  if (req.body.name !== undefined) {
    brand.name = requireNonEmptyString(req.body.name, 'tên thương hiệu', 'name');
  }
  if (req.body.origin !== undefined) {
    brand.origin = requireNonEmptyString(req.body.origin, 'quốc gia xuất xứ', 'origin');
  }
  if (req.body.status !== undefined) {
    brand.status = requireEnum(req.body.status, VALID_BRAND_STATUSES, 'Trạng thái thương hiệu', 'status');
  }
  if (req.body.productsCount !== undefined) {
    brand.productsCount = requireNumber(req.body.productsCount, 'Số lượng sản phẩm', { min: 0 });
  }
  if (req.body.revenue !== undefined) {
    brand.revenue = requireNumber(req.body.revenue, 'Doanh thu thương hiệu', { min: 0 });
  }

  await brand.save();

  if (oldName !== brand.name) {
    await Product.updateMany(
      { $or: [{ brandRef: brand._id }, { brand: oldName }] },
      { $set: { brand: brand.name } }
    );
  }

  return sendSuccess(res, brand);
});

export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) {
    throw new AppError('Không tìm thấy thương hiệu cần xóa.', 404, 'NOT_FOUND');
  }

  return sendSuccess(res, { id: brand.id, deleted: true });
});
