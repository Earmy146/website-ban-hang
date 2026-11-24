import { Customer, Segment, Coupon, ModuleRecord, Notification } from '../models/index.js';
import { AppError, asyncHandler, sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { escapeRegex, formatViTime, makeAvatarInitials } from '../utils/helpers.js';
import {
  optionalNumber,
  requireEnum,
  requireIdsArray,
  requireNonEmptyString,
  requireValidEmail
} from '../middleware/validate.js';

const VALID_SEGMENTS = ['Khách VIP', 'Khách quen', 'Khách mới'];
const VALID_MARKETING = ['Đã đăng ký', 'Chưa đăng ký'];
const VALID_CUSTOMER_STATUS = ['Active', 'Inactive'];

// ==========================================
// 1. CUSTOMERS
// ==========================================

export const getCustomers = asyncHandler(async (req, res) => {
  const { segment, marketing, search } = req.query;
  const filter = {};

  if (segment && segment !== 'all') {
    filter.segment = segment;
  }
  if (marketing && marketing !== 'all') {
    filter.marketing = marketing;
  }
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { location: rx }];
  }

  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, customers, { total: customers.length });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'họ và tên khách hàng', 'name');
  const email = requireValidEmail(req.body.email, 'địa chỉ email khách hàng', 'email');

  if (await Customer.exists({ email })) {
    throw new AppError(
      `Địa chỉ email "${email}" đã được đăng ký cho khách hàng khác.`,
      409,
      'CONFLICT',
      [{ field: 'email', message: 'Email khách hàng bị trùng lặp' }]
    );
  }

  const segment = req.body.segment
    ? requireEnum(req.body.segment, VALID_SEGMENTS, 'Phân khúc khách hàng', 'segment')
    : 'Khách mới';

  const marketing = req.body.marketing
    ? requireEnum(req.body.marketing, VALID_MARKETING, 'Trạng thái nhận tin tiếp thị', 'marketing')
    : 'Đã đăng ký';

  const customer = await Customer.create({
    name,
    email,
    phone: req.body.phone ? String(req.body.phone).trim() : '',
    avatar: makeAvatarInitials(name, 'KH'),
    segment,
    ordersCount: 0,
    totalSpent: 0,
    aov: 0,
    lastOrder: 'Chưa có đơn hàng',
    location:
      req.body.location && String(req.body.location).trim()
        ? String(req.body.location).trim()
        : 'TP. Hồ Chí Minh, Việt Nam',
    marketing,
    status: 'Active'
  });

  return sendCreated(res, customer);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    throw new AppError('Không tìm thấy hồ sơ khách hàng cần chỉnh sửa.', 404, 'NOT_FOUND');
  }

  if (req.body.name !== undefined) {
    customer.name = requireNonEmptyString(req.body.name, 'họ và tên khách hàng', 'name');
    customer.avatar = makeAvatarInitials(customer.name, 'KH');
  }
  if (req.body.email !== undefined) {
    const nextEmail = requireValidEmail(req.body.email, 'địa chỉ email khách hàng', 'email');
    if (nextEmail !== customer.email && (await Customer.exists({ email: nextEmail, _id: { $ne: customer._id } }))) {
      throw new AppError(
        `Địa chỉ email "${nextEmail}" đã được sử dụng bởi khách hàng khác.`,
        409,
        'CONFLICT',
        [{ field: 'email', message: 'Email khách hàng bị trùng lặp' }]
      );
    }
    customer.email = nextEmail;
  }
  if (req.body.phone !== undefined) {
    customer.phone = String(req.body.phone).trim();
  }
  if (req.body.location !== undefined) {
    customer.location = String(req.body.location).trim();
  }
  if (req.body.segment !== undefined) {
    customer.segment = requireEnum(req.body.segment, VALID_SEGMENTS, 'Phân khúc khách hàng', 'segment');
  }
  if (req.body.marketing !== undefined) {
    customer.marketing = requireEnum(req.body.marketing, VALID_MARKETING, 'Trạng thái tiếp thị', 'marketing');
  }
  if (req.body.status !== undefined) {
    customer.status = requireEnum(req.body.status, VALID_CUSTOMER_STATUS, 'Trạng thái tài khoản', 'status');
  }

  await customer.save();
  return sendSuccess(res, customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) {
    throw new AppError('Không tìm thấy hồ sơ khách hàng cần xóa.', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { id: customer.id, deleted: true });
});

export const bulkDeleteCustomers = asyncHandler(async (req, res) => {
  const ids = requireIdsArray(req.body.ids, 'khách hàng');
  const result = await Customer.deleteMany({ _id: { $in: ids } });

  return sendSuccess(res, {
    deletedCount: result.deletedCount,
    ids
  });
});

export const bulkEmailCustomers = asyncHandler(async (req, res) => {
  const ids = requireIdsArray(req.body.ids, 'khách hàng nhận email');
  const subject = requireNonEmptyString(req.body.subject, 'tiêu đề chiến dịch email', 'subject');
  const rawContent = req.body.content ?? req.body.message ?? req.body.body;
  const content = requireNonEmptyString(rawContent, 'nội dung chiến dịch email', 'content');

  const customers = await Customer.find({ _id: { $in: ids } }).select('name email segment').lean();
  if (customers.length === 0) {
    throw new AppError('Không tìm thấy khách hàng hợp lệ trong danh sách đã chọn.', 404, 'NOT_FOUND');
  }

  const recipients = customers.map((c) => ({
    id: String(c._id),
    name: c.name,
    email: c.email
  }));

  await ModuleRecord.create({
    moduleSlug: 'email',
    name: subject,
    code: `EML-${Date.now().toString().slice(-5)}`,
    date: `Hôm nay, ${formatViTime()}`,
    status: 'Đã gửi',
    statusClass: 'green',
    count: recipients.length,
    value: `${recipients.length} người nhận`,
    subtitle: `Gửi tới ${recipients.map((r) => r.name).slice(0, 3).join(', ')}${recipients.length > 3 ? '...' : ''}`,
    category: 'Chiến dịch CSKH',
    owner: 'Alex Chen',
    notes: content
  });

  return sendSuccess(res, {
    sentCount: recipients.length,
    subject,
    recipients
  });
});

// ==========================================
// 2. SEGMENTS
// ==========================================

export const getSegments = asyncHandler(async (_req, res) => {
  const segments = await Segment.find().sort({ createdAt: 1 });
  return sendSuccess(res, segments, { total: segments.length });
});

export const createSegment = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'tên phân khúc khách hàng', 'name');
  if (await Segment.exists({ name })) {
    throw new AppError(
      `Phân khúc khách hàng "${name}" đã tồn tại trong hệ thống.`,
      409,
      'CONFLICT',
      [{ field: 'name', message: 'Tên phân khúc bị trùng lặp' }]
    );
  }

  const criteria =
    req.body.criteria && String(req.body.criteria).trim()
      ? String(req.body.criteria).trim()
      : 'Tùy chỉnh thủ công';
  const color =
    req.body.color && String(req.body.color).trim()
      ? String(req.body.color).trim()
      : '#10b981';

  const segment = await Segment.create({
    name,
    criteria,
    color,
    count: optionalNumber(req.body.count, 0, { min: 0 }),
    aov: optionalNumber(req.body.aov, 0, { min: 0 })
  });

  return sendCreated(res, segment);
});

export const updateSegment = asyncHandler(async (req, res) => {
  const segment = await Segment.findById(req.params.id);
  if (!segment) {
    throw new AppError('Không tìm thấy phân khúc khách hàng cần chỉnh sửa.', 404, 'NOT_FOUND');
  }

  if (req.body.name !== undefined) {
    const nextName = requireNonEmptyString(req.body.name, 'tên phân khúc khách hàng', 'name');
    if (nextName !== segment.name && (await Segment.exists({ name: nextName, _id: { $ne: segment._id } }))) {
      throw new AppError(
        `Phân khúc khách hàng "${nextName}" đã tồn tại trong hệ thống.`,
        409,
        'CONFLICT',
        [{ field: 'name', message: 'Tên phân khúc bị trùng lặp' }]
      );
    }
    segment.name = nextName;
  }

  if (req.body.criteria !== undefined) {
    segment.criteria = requireNonEmptyString(req.body.criteria, 'điều kiện phân nhóm', 'criteria');
  }
  if (req.body.color !== undefined && String(req.body.color).trim()) {
    segment.color = String(req.body.color).trim();
  }
  if (req.body.count !== undefined) {
    segment.count = optionalNumber(req.body.count, segment.count, { min: 0 });
  }
  if (req.body.aov !== undefined) {
    segment.aov = optionalNumber(req.body.aov, segment.aov, { min: 0 });
  }

  await segment.save();
  return sendSuccess(res, segment);
});

export const sendSegmentOffer = asyncHandler(async (req, res) => {
  const segment = await Segment.findById(req.params.id);
  if (!segment) {
    throw new AppError('Không tìm thấy phân khúc khách hàng để gửi ưu đãi.', 404, 'NOT_FOUND');
  }

  const rawCoupon = req.body.couponCode ? String(req.body.couponCode).trim().toUpperCase() : 'HELLO10';
  const message =
    req.body.message && String(req.body.message).trim()
      ? String(req.body.message).trim()
      : `Ưu đãi dành riêng cho nhóm ${segment.name}`;

  if (req.body.couponCode) {
    const existingCoupon = await Coupon.findOne({ code: rawCoupon });
    if (!existingCoupon) {
      throw new AppError(`Mã giảm giá "${rawCoupon}" không tồn tại trong hệ thống.`, 400, 'VALIDATION_ERROR');
    }
  }

  // Đếm khách hàng thuộc phân khúc (hoặc dựa trên quy mô của phân khúc)
  const segKey = segment.name.includes('VIP')
    ? 'Khách VIP'
    : segment.name.includes('quen')
    ? 'Khách quen'
    : 'Khách mới';
  const matchedCount = await Customer.countDocuments({ segment: segKey });
  const sentCount = Math.max(segment.count || 0, matchedCount, 1);

  await Promise.all([
    ModuleRecord.create({
      moduleSlug: 'campaigns',
      name: `Ưu đãi ${rawCoupon} · ${segment.name}`,
      code: `CMP-${Date.now().toString().slice(-5)}`,
      date: `Hôm nay, ${formatViTime()}`,
      status: 'Hoạt động',
      statusClass: 'green',
      count: sentCount,
      value: rawCoupon,
      subtitle: message,
      category: 'Tiếp thị phân khúc',
      owner: 'Alex Chen',
      notes: `Đã gửi mã ưu đãi ${rawCoupon} cho ${sentCount} khách hàng nhóm "${segment.name}".`
    }),
    Notification.create({
      title: `Đã phát hành ưu đãi cho ${segment.name}`,
      detail: `Mã ${rawCoupon} đã được gửi tới ${sentCount} khách hàng.`,
      time: 'Vừa xong',
      unread: true,
      type: 'info'
    })
  ]);

  return sendSuccess(res, {
    segmentId: segment.id,
    segmentName: segment.name,
    sentCount,
    couponCode: rawCoupon,
    message
  });
});

export const deleteSegment = asyncHandler(async (req, res) => {
  const segment = await Segment.findByIdAndDelete(req.params.id);
  if (!segment) {
    throw new AppError('Không tìm thấy phân khúc khách hàng cần xóa.', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { id: segment.id, deleted: true });
});
