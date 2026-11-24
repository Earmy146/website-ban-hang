import { Coupon, Review, Transaction, Order, Product } from '../models/index.js';
import { AppError, asyncHandler, sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { escapeRegex, findByCodeOrId } from '../utils/helpers.js';
import {
  optionalNumber,
  requireEnum,
  requireIdsArray,
  requireNonEmptyString,
  requireNumber
} from '../middleware/validate.js';

const VALID_DISCOUNT_TYPES = ['Phần trăm (%)', 'Số tiền cố định ($)', 'Miễn phí vận chuyển'];
const VALID_COUPON_STATUSES = ['Active', 'Scheduled', 'Expired'];
const VALID_REVIEW_STATUSES = ['Published', 'Pending', 'Flagged'];

// ==========================================
// 1. COUPONS
// ==========================================

export const getCoupons = asyncHandler(async (req, res) => {
  const { discountType, status, search } = req.query;
  const filter = {};

  if (discountType && discountType !== 'all') {
    filter.discountType = discountType;
  }
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ code: rx }, { eligibility: rx }, { discountType: rx }];
  }

  const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, coupons, { total: coupons.length });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const rawCode = requireNonEmptyString(req.body.code, 'mã khuyến mãi (code)', 'code');
  const code = rawCode.toUpperCase().replace(/\s+/g, '');

  if (await Coupon.exists({ code })) {
    throw new AppError(
      `Mã giảm giá "${code}" đã tồn tại trong hệ thống.`,
      409,
      'CONFLICT',
      [{ field: 'code', message: 'Mã giảm giá bị trùng lặp' }]
    );
  }

  const discountType = req.body.discountType
    ? requireEnum(req.body.discountType, VALID_DISCOUNT_TYPES, 'Hình thức giảm giá', 'discountType')
    : 'Phần trăm (%)';

  const value =
    discountType === 'Miễn phí vận chuyển'
      ? 0
      : optionalNumber(req.body.value, 10, {
          min: 0,
          max: discountType === 'Phần trăm (%)' ? 100 : undefined,
          fieldLabel: 'Giá trị ưu đãi',
          fieldName: 'value'
        });

  const minSpend = optionalNumber(req.body.minSpend, 0, {
    min: 0,
    fieldLabel: 'Đơn hàng tối thiểu',
    fieldName: 'minSpend'
  });

  const usageLimit = Math.round(
    optionalNumber(req.body.usageLimit, 100, {
      min: 1,
      fieldLabel: 'Giới hạn lượt dùng',
      fieldName: 'usageLimit'
    })
  );

  const status = req.body.status
    ? requireEnum(req.body.status, VALID_COUPON_STATUSES, 'Trạng thái mã giảm giá', 'status')
    : 'Active';

  const coupon = await Coupon.create({
    code,
    discountType,
    value,
    minSpend,
    eligibility:
      req.body.eligibility && String(req.body.eligibility).trim()
        ? String(req.body.eligibility).trim()
        : 'Tất cả mọi người',
    status,
    usageCount: 0,
    usageLimit,
    startDate: req.body.startDate || 'Hôm nay',
    endDate: req.body.endDate || '31 Thg 12, 2026'
  });

  return sendCreated(res, coupon);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    throw new AppError('Không tìm thấy mã giảm giá cần chỉnh sửa.', 404, 'NOT_FOUND');
  }

  if (req.body.code !== undefined) {
    coupon.code = requireNonEmptyString(req.body.code, 'mã khuyến mãi', 'code').toUpperCase();
  }
  if (req.body.discountType !== undefined) {
    coupon.discountType = requireEnum(
      req.body.discountType,
      VALID_DISCOUNT_TYPES,
      'Hình thức giảm giá',
      'discountType'
    );
  }
  if (req.body.value !== undefined) {
    coupon.value = requireNumber(req.body.value, 'Giá trị ưu đãi', {
      min: 0,
      max: coupon.discountType === 'Phần trăm (%)' ? 100 : undefined,
      fieldName: 'value'
    });
  }
  if (req.body.minSpend !== undefined) {
    coupon.minSpend = requireNumber(req.body.minSpend, 'Đơn hàng tối thiểu', { min: 0, fieldName: 'minSpend' });
  }
  if (req.body.usageLimit !== undefined) {
    coupon.usageLimit = Math.round(
      requireNumber(req.body.usageLimit, 'Giới hạn lượt dùng', { min: 1, fieldName: 'usageLimit' })
    );
  }
  if (req.body.eligibility !== undefined) {
    coupon.eligibility = requireNonEmptyString(req.body.eligibility, 'đối tượng áp dụng', 'eligibility');
  }
  if (req.body.status !== undefined) {
    coupon.status = requireEnum(req.body.status, VALID_COUPON_STATUSES, 'Trạng thái mã giảm giá', 'status');
  }
  if (req.body.startDate !== undefined) {
    coupon.startDate = String(req.body.startDate).trim();
  }
  if (req.body.endDate !== undefined) {
    coupon.endDate = String(req.body.endDate).trim();
  }

  await coupon.save();
  return sendSuccess(res, coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    throw new AppError('Không tìm thấy mã giảm giá cần xóa.', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { id: coupon.id, deleted: true });
});

export const bulkDeleteCoupons = asyncHandler(async (req, res) => {
  const ids = requireIdsArray(req.body.ids, 'mã giảm giá');
  const result = await Coupon.deleteMany({ _id: { $in: ids } });

  return sendSuccess(res, {
    deletedCount: result.deletedCount,
    ids
  });
});

// ==========================================
// 2. REVIEWS
// ==========================================

export const getReviews = asyncHandler(async (req, res) => {
  const { rating, status, search } = req.query;
  const filter = {};

  if (rating && rating !== 'all') {
    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw new AppError('Số sao lọc đánh giá phải từ 1 đến 5.', 400, 'VALIDATION_ERROR');
    }
    filter.rating = parsedRating;
  }

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ productName: rx }, { customerName: rx }, { title: rx }, { comment: rx }];
  }

  const reviews = await Review.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, reviews, { total: reviews.length });
});

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const status = requireEnum(req.body.status, VALID_REVIEW_STATUSES, 'Trạng thái duyệt đánh giá', 'status');

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true, runValidators: true }
  );

  if (!review) {
    throw new AppError('Không tìm thấy đánh giá cần cập nhật trạng thái.', 404, 'NOT_FOUND');
  }

  return sendSuccess(res, review);
});

export const replyReview = asyncHandler(async (req, res) => {
  const response = requireNonEmptyString(req.body.response, 'nội dung phản hồi đánh giá', 'response');

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $set: { response } },
    { new: true, runValidators: true }
  );

  if (!review) {
    throw new AppError('Không tìm thấy đánh giá cần phản hồi.', 404, 'NOT_FOUND');
  }

  return sendSuccess(res, review);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) {
    throw new AppError('Không tìm thấy đánh giá cần xóa.', 404, 'NOT_FOUND');
  }

  const productQuery = review.productRef
    ? { $or: [{ _id: review.productRef }, { name: review.productName }] }
    : { name: review.productName };

  const product = await Product.findOne(productQuery);
  if (product) {
    const remaining = await Review.find({
      status: 'Published',
      $or: [{ productRef: product._id }, { productName: product.name }]
    })
      .select('rating')
      .lean();

    product.rating =
      remaining.length > 0
        ? +(remaining.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / remaining.length).toFixed(1)
        : 5.0;
    await product.save();
  }

  return sendSuccess(res, {
    id: review.id,
    deleted: true,
    productRating: product ? product.rating : null
  });
});

// ==========================================
// 3. TRANSACTIONS
// ==========================================

export const getTransactions = asyncHandler(async (req, res) => {
  const { gateway, status, search } = req.query;
  const filter = {};

  if (gateway && gateway !== 'all') {
    filter.gateway = gateway;
  }
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (search && String(search).trim()) {
    const clean = String(search).trim().replace(/^#/, '');
    const rx = new RegExp(escapeRegex(clean), 'i');
    filter.$or = [{ txnCode: rx }, { orderId: rx }, { customer: rx }, { gateway: rx }];
  }

  const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, transactions, { total: transactions.length });
});

export const refundTransaction = asyncHandler(async (req, res) => {
  const txn = await findByCodeOrId(Transaction, req.params.id, 'txnCode');
  if (!txn) {
    throw new AppError(`Không tìm thấy giao dịch "${req.params.id}" để hoàn tiền.`, 404, 'NOT_FOUND');
  }

  if (txn.status === 'Refunded') {
    throw new AppError('Giao dịch này đã được hoàn tiền trước đó.', 400, 'ALREADY_REFUNDED');
  }

  txn.status = 'Refunded';
  txn.statusText = 'Đã hoàn tiền';
  txn.statusClass = 'red';
  txn.fee = 0;
  txn.net = -Math.abs(Number(txn.amount) || 0);
  await txn.save();

  // Đồng bộ trạng thái thanh toán của Order liên kết thành 'Refunded'
  const orderQuery = txn.orderRef
    ? { $or: [{ _id: txn.orderRef }, { orderCode: txn.orderId }] }
    : { orderCode: txn.orderId };
  await Order.updateOne(orderQuery, { $set: { paymentStatus: 'Refunded' } });

  return sendSuccess(res, txn);
});
