import {
  Vendor,
  Conversation,
  AiWorkflow,
  TeamMember,
  StoreSetting,
  ModuleRecord,
  ModuleConfig,
  Product,
  Order,
  StockItem,
  Customer
} from '../models/index.js';
import { AppError, asyncHandler, sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { escapeRegex, formatViTime, makeAvatarInitials } from '../utils/helpers.js';
import {
  optionalNumber,
  requireEnum,
  requireIdsArray,
  requireNonEmptyString,
  requireNumber,
  requireValidEmail
} from '../middleware/validate.js';

// ==========================================
// 1. VENDORS (MARKETPLACE)
// ==========================================

export const getVendors = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ name: rx }, { owner: rx }];
  }

  const vendors = await Vendor.find(filter).sort({ sales: -1, createdAt: -1 });
  return sendSuccess(res, vendors, { total: vendors.length });
});

export const createVendor = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'tên đối tác / doanh nghiệp', 'name');
  const commission = optionalNumber(req.body.commission, 12, {
    min: 0,
    max: 100,
    fieldLabel: 'Mức hoa hồng sàn (%)',
    fieldName: 'commission'
  });

  const vendor = await Vendor.create({
    name,
    owner:
      req.body.owner && String(req.body.owner).trim()
        ? String(req.body.owner).trim()
        : 'Người đại diện',
    commission,
    sales: optionalNumber(req.body.sales, 0, { min: 0 }),
    pendingPayout: optionalNumber(req.body.pendingPayout, 0, { min: 0 }),
    status: req.body.status
      ? requireEnum(req.body.status, ['Active', 'Pending', 'Suspended'], 'Trạng thái đối tác', 'status')
      : 'Active',
    products: optionalNumber(req.body.products, 0, { min: 0 })
  });

  return sendCreated(res, vendor);
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    throw new AppError('Không tìm thấy đối tác người bán cần cập nhật.', 404, 'NOT_FOUND');
  }

  if (req.body.name !== undefined) {
    vendor.name = requireNonEmptyString(req.body.name, 'tên đối tác', 'name');
  }
  if (req.body.owner !== undefined) {
    vendor.owner = requireNonEmptyString(req.body.owner, 'người đại diện', 'owner');
  }
  if (req.body.commission !== undefined) {
    vendor.commission = requireNumber(req.body.commission, 'Mức hoa hồng sàn (%)', {
      min: 0,
      max: 100,
      fieldName: 'commission'
    });
  }
  if (req.body.sales !== undefined) {
    vendor.sales = requireNumber(req.body.sales, 'Tổng doanh số', { min: 0 });
  }
  if (req.body.pendingPayout !== undefined) {
    vendor.pendingPayout = requireNumber(req.body.pendingPayout, 'Số dư chờ quyết toán', { min: 0 });
  }
  if (req.body.products !== undefined) {
    vendor.products = Math.round(requireNumber(req.body.products, 'Số lượng sản phẩm', { min: 0 }));
  }
  if (req.body.status !== undefined) {
    vendor.status = requireEnum(
      req.body.status,
      ['Active', 'Pending', 'Suspended'],
      'Trạng thái đối tác',
      'status'
    );
  }

  await vendor.save();
  return sendSuccess(res, vendor);
});

export const updateVendorStatus = asyncHandler(async (req, res) => {
  const status = requireEnum(
    req.body.status,
    ['Active', 'Pending', 'Suspended'],
    'Trạng thái đối tác',
    'status'
  );

  const vendor = await Vendor.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true, runValidators: true }
  );

  if (!vendor) {
    throw new AppError('Không tìm thấy đối tác người bán.', 404, 'NOT_FOUND');
  }

  return sendSuccess(res, vendor);
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByIdAndDelete(req.params.id);
  if (!vendor) {
    throw new AppError('Không tìm thấy đối tác người bán cần xóa.', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { id: vendor.id, deleted: true });
});

export const payoutVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    throw new AppError('Không tìm thấy đối tác người bán để quyết toán.', 404, 'NOT_FOUND');
  }

  const paidAmount = vendor.pendingPayout || 0;
  vendor.pendingPayout = 0;
  await vendor.save();

  await ModuleRecord.create({
    moduleSlug: 'payouts',
    name: `Quyết toán định kỳ · ${vendor.name}`,
    code: `PAY-${Date.now().toString().slice(-5)}`,
    date: `Hôm nay, ${formatViTime()}`,
    status: 'Đã hoàn tất',
    statusClass: 'green',
    count: vendor.products || 0,
    value: `$${paidAmount.toLocaleString('en-US')}`,
    subtitle: `Đại diện: ${vendor.owner}`,
    category: 'Quyết toán sàn',
    owner: 'Alex Chen',
    notes: `Đã tất toán $${paidAmount.toLocaleString('en-US')} cho đối tác ${vendor.name}.`
  });

  return sendSuccess(res, vendor, { paidAmount });
});

export const getVendorReport = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) {
    throw new AppError('Không tìm thấy đối tác người bán.', 404, 'NOT_FOUND');
  }

  const sales = Number(vendor.sales) || 0;
  const commissionRate = Number(vendor.commission) || 0;
  const commissionEarned = +((sales * commissionRate) / 100).toFixed(2);
  const netSales = +(sales - commissionEarned).toFixed(2);

  // Tìm sản phẩm liên quan tới thương hiệu của đối tác hoặc sản phẩm bán chạy
  const brandKeyword = vendor.name.includes('Veylix')
    ? 'Veylix'
    : vendor.name.includes('Northline')
    ? 'Northline'
    : vendor.name.includes('Forma')
    ? 'Forma'
    : '';

  let productsList = brandKeyword
    ? await Product.find({
        isDeleted: { $ne: true },
        brand: new RegExp(escapeRegex(brandKeyword), 'i')
      }).limit(6)
    : [];

  if (productsList.length === 0) {
    productsList = await Product.find({ isDeleted: { $ne: true } }).sort({ sales: -1 }).limit(4);
  }

  const recentOrders = await Order.find({ fulfillmentStatus: { $ne: 'Cancelled' } })
    .sort({ createdAt: -1 })
    .limit(5);

  return sendSuccess(res, {
    vendor,
    commissionEarned,
    netSales,
    recentOrders,
    productsList
  });
});

// ==========================================
// 2. CONVERSATIONS (CHAT SUPPORT)
// ==========================================

export const getConversations = asyncHandler(async (req, res) => {
  const { search, unreadOnly } = req.query;
  const filter = {};
  if (unreadOnly === 'true') {
    filter.unread = true;
  }
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [{ customer: rx }, { lastMessage: rx }];
  }

  const conversations = await Conversation.find(filter).sort({ unread: -1, updatedAt: -1, createdAt: 1 });
  return sendSuccess(res, conversations, { total: conversations.length });
});

export const createConversation = asyncHandler(async (req, res) => {
  const customerName = requireNonEmptyString(req.body.customer, 'tên khách hàng hội thoại', 'customer');
  const initialMessage = requireNonEmptyString(
    req.body.initialMessage ?? req.body.text,
    'tin nhắn khởi tạo',
    'initialMessage'
  );
  const sender = req.body.sender
    ? requireEnum(req.body.sender, ['shop', 'customer', 'bot'], 'Người gửi', 'sender')
    : 'shop';

  let customerDoc = null;
  if (req.body.email && String(req.body.email).trim()) {
    customerDoc = await Customer.findOne({ email: String(req.body.email).trim().toLowerCase() });
  }
  if (!customerDoc) {
    customerDoc = await Customer.findOne({
      name: new RegExp(`^${escapeRegex(customerName)}$`, 'i')
    });
  }

  const conv = await Conversation.create({
    customerRef: customerDoc ? customerDoc._id : null,
    customer: customerName,
    avatar: customerDoc?.avatar || makeAvatarInitials(customerName, 'KH'),
    lastMessage: initialMessage,
    time: 'Vừa xong',
    unread: sender === 'customer',
    messages: [
      {
        sender,
        text: initialMessage,
        time: formatViTime()
      }
    ]
  });

  return sendCreated(res, conv);
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const conv = await Conversation.findByIdAndUpdate(
    req.params.id,
    { $set: { unread: false } },
    { new: true }
  );
  if (!conv) {
    throw new AppError('Không tìm thấy cuộc hội thoại hỗ trợ.', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, conv);
});

export const sendConversationMessage = asyncHandler(async (req, res) => {
  const text = requireNonEmptyString(req.body.text, 'nội dung tin nhắn', 'text');
  const sender = req.body.sender
    ? requireEnum(req.body.sender, ['shop', 'customer', 'bot'], 'Người gửi tin nhắn', 'sender')
    : 'shop';

  const conv = await Conversation.findById(req.params.id);
  if (!conv) {
    throw new AppError('Không tìm thấy cuộc hội thoại để gửi tin nhắn.', 404, 'NOT_FOUND');
  }

  const newMessage = {
    sender,
    text,
    time: formatViTime()
  };

  conv.messages.push(newMessage);
  conv.lastMessage = text;
  conv.time = 'Vừa xong';
  conv.unread = sender === 'customer';

  await conv.save();
  return sendCreated(res, conv);
});

// ==========================================
// 3. AI WORKFLOWS & AI STUDIO
// ==========================================

export const getAiWorkflows = asyncHandler(async (_req, res) => {
  const workflows = await AiWorkflow.find().sort({ createdAt: 1 });
  return sendSuccess(res, workflows, { total: workflows.length });
});

export const createAiWorkflow = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'tên quy trình AI', 'name');
  const description =
    req.body.description && String(req.body.description).trim()
      ? String(req.body.description).trim()
      : 'Quy trình AI tự động hóa vận hành cửa hàng.';
  const trigger =
    req.body.trigger && String(req.body.trigger).trim()
      ? String(req.body.trigger).trim()
      : 'Sản phẩm mới được tạo';

  const workflow = await AiWorkflow.create({
    name,
    description,
    trigger,
    status: 'Active',
    runsCount: 0,
    lastRun: 'Chưa chạy',
    logs: []
  });

  return sendCreated(res, workflow);
});

export const updateAiWorkflow = asyncHandler(async (req, res) => {
  const workflow = await AiWorkflow.findById(req.params.id);
  if (!workflow) {
    throw new AppError('Không tìm thấy quy trình AI cần chỉnh sửa.', 404, 'NOT_FOUND');
  }

  if (req.body.name !== undefined) {
    workflow.name = requireNonEmptyString(req.body.name, 'tên quy trình AI', 'name');
  }
  if (req.body.description !== undefined) {
    workflow.description = String(req.body.description).trim();
  }
  if (req.body.trigger !== undefined) {
    workflow.trigger = requireNonEmptyString(req.body.trigger, 'sự kiện kích hoạt', 'trigger');
  }
  if (req.body.status !== undefined) {
    workflow.status = requireEnum(req.body.status, ['Active', 'Paused'], 'Trạng thái quy trình', 'status');
  }

  await workflow.save();
  return sendSuccess(res, workflow);
});

export const deleteAiWorkflow = asyncHandler(async (req, res) => {
  const workflow = await AiWorkflow.findByIdAndDelete(req.params.id);
  if (!workflow) {
    throw new AppError('Không tìm thấy quy trình AI cần xóa.', 404, 'NOT_FOUND');
  }
  return sendSuccess(res, { id: workflow.id, deleted: true });
});

export const toggleAiWorkflow = asyncHandler(async (req, res) => {
  const workflow = await AiWorkflow.findById(req.params.id);
  if (!workflow) {
    throw new AppError('Không tìm thấy quy trình AI cần chuyển trạng thái.', 404, 'NOT_FOUND');
  }

  workflow.status = workflow.status === 'Active' ? 'Paused' : 'Active';
  await workflow.save();

  return sendSuccess(res, workflow);
});

export const runAiWorkflow = asyncHandler(async (req, res) => {
  const workflow = await AiWorkflow.findById(req.params.id);
  if (!workflow) {
    throw new AppError('Không tìm thấy quy trình AI để chạy thử.', 404, 'NOT_FOUND');
  }

  const [lowStockCount, latestProduct] = await Promise.all([
    StockItem.countDocuments({ status: { $in: ['Low', 'Out'] } }),
    Product.findOne({ isDeleted: { $ne: true } }).sort({ sales: -1 }).lean()
  ]);

  workflow.runsCount = (Number(workflow.runsCount) || 0) + 1;
  workflow.lastRun = 'Vừa xong';

  const nowLabel = `Hôm nay, ${formatViTime()}`;
  let outputDetail = `Đã quét sự kiện "${workflow.trigger}" và đồng bộ tự động thành công trong 420ms.`;
  if (workflow.name.toLowerCase().includes('kho') || workflow.trigger.toLowerCase().includes('kho')) {
    outputDetail = `Phát hiện ${lowStockCount} mặt hàng dưới ngưỡng an toàn. Đã tạo đề xuất nhập bổ sung 50 đơn vị cho kho trung tâm NY.`;
  } else if (workflow.name.toLowerCase().includes('seo') || workflow.name.toLowerCase().includes('mô tả')) {
    outputDetail = `Đã sinh chuẩn hóa Meta Title, Description & 6 từ khóa SEO cho "${latestProduct?.name || 'Áo thun Everyday Tee'}" (${latestProduct?.sku || 'VX-1001'}).`;
  } else if (workflow.name.toLowerCase().includes('đánh giá')) {
    outputDetail = 'Đã phân tích cảm xúc 5 đánh giá gần nhất (100% Tích cực/Trung tính) và gợi ý mẫu phản hồi tự động.';
  }

  const nextLog = {
    time: nowLabel,
    summary: `Chạy lần #${workflow.runsCount} hoàn tất`,
    output: outputDetail
  };

  workflow.logs = [nextLog, ...(Array.isArray(workflow.logs) ? workflow.logs : [])].slice(0, 15);
  await workflow.save();

  return sendSuccess(res, workflow);
});

export const generateAiContent = asyncHandler(async (req, res) => {
  const rawType = String(req.body.type || 'seo').trim().toLowerCase();
  const type = ['seo', 'email', 'reply', 'social'].includes(rawType) ? rawType : 'seo';
  const rawPrompt = req.body.prompt || req.body.productName || '';
  const prompt = requireNonEmptyString(rawPrompt, 'yêu cầu hoặc tên sản phẩm cho AI', 'prompt');
  const productNameInput = req.body.productName ? String(req.body.productName).trim() : '';
  const tone = req.body.tone ? String(req.body.tone).trim() : 'Sang trọng & Tinh tế';

  // Tìm sản phẩm thật trong MongoDB để đưa thông số chuẩn xác vào nội dung AI
  const searchKey = productNameInput || prompt;
  let matchedProduct = await Product.findOne({
    isDeleted: { $ne: true },
    $or: [
      { name: new RegExp(escapeRegex(searchKey.split(',')[0].trim()), 'i') },
      { sku: new RegExp(escapeRegex(searchKey.trim()), 'i') }
    ]
  }).lean();

  if (!matchedProduct) {
    matchedProduct = await Product.findOne({ isDeleted: { $ne: true } }).sort({ sales: -1 }).lean();
  }

  const pName = productNameInput || matchedProduct?.name || 'Bộ sưu tập Veylix Studio';
  const pPrice = matchedProduct?.price ? `$${Number(matchedProduct.price).toFixed(2)}` : '$49.00';
  const pCategory = matchedProduct?.category || 'Thời trang & Phong cách sống';
  const pDesc = matchedProduct?.desc || 'Thiết kế tối giản chuẩn Bắc Âu, chất liệu tuyển chọn bền vững.';
  const pSku = matchedProduct?.sku || 'VX-STUDIO';

  let title = '';
  let content = '';

  if (type === 'seo') {
    title = `Mô tả chuẩn SEO: ${pName}`;
    content = [
      `【META TITLE】: ${pName} Chính Hãng | ${pCategory} Veylix Studio (${pSku})`,
      `【META DESCRIPTION】: Khám phá ${pName} chỉ ${pPrice} tại Veylix. ${pDesc} Miễn phí giao hàng cho đơn từ $75, đổi trả linh hoạt 30 ngày.`,
      '',
      `【MÔ TẢ CHI TIẾT SẢN PHẨM (${tone})】:`,
      `${pName} là tuyên ngôn của phong cách tối giản đương đại từ Veylix Studio. ${pDesc}`,
      `• Mã định danh: ${pSku} · Phân khúc: ${pCategory}`,
      `• Giá niêm yết: ${pPrice} (Cam kết chất lượng xuất khẩu)`,
      `• Ứng dụng thực tế: ${prompt}`,
      '',
      `【TỪ KHÓA ĐỀ XUẤT】: ${pName.toLowerCase()}, veylix studio, ${pCategory.toLowerCase()}, mua sắm tối giản, quà tặng cao cấp`
    ].join('\n');
  } else if (type === 'email') {
    title = `Email Chiến dịch: Ưu đãi ${pName}`;
    content = [
      `Tiêu đề Email: ✨ Dành riêng cho bạn: Trải nghiệm ${pName} cùng ưu đãi 10% từ Veylix`,
      `Preheader: Thiết kế tinh giản được yêu thích nhất tuần qua đã sẵn sàng giao ngay.`,
      '',
      `Xin chào Quý khách,`,
      '',
      `Tại Veylix Studio, chúng tôi tin rằng những vật dụng gắn bó mỗi ngày xứng đáng đạt độ hoàn thiện cao nhất. Lấy cảm hứng từ yêu cầu "${prompt}", chúng tôi trân trọng giới thiệu **${pName}** (${pPrice}).`,
      '',
      `Điểm nhấn nổi bật: ${pDesc}`,
      `🎁 Nhập mã **HELLO10** ở bước thanh toán để nhận ngay ưu đãi giảm 10% cho đơn hàng hôm nay.`,
      '',
      `[Khám phá ngay tại Cửa hàng Veylix -> /store/products]`,
      `Trân trọng,\nĐội ngũ Chăm sóc Khách hàng Veylix Studio (Giọng văn: ${tone})`
    ].join('\n');
  } else if (type === 'reply') {
    title = `Phản hồi CSKH: ${prompt.slice(0, 48)}`;
    content = [
      `Chào Anh/Chị,`,
      '',
      `Cảm ơn Anh/Chị đã liên hệ với bộ phận Chăm sóc Khách hàng của Veylix Studio. Về vấn đề "${prompt}" liên quan tới sản phẩm ${pName}, cửa hàng xin phản hồi chi tiết như sau:`,
      '',
      `1. Chúng tôi đã kiểm tra ngay trên hệ thống quản lý kho & vận đơn và ưu tiên xử lý hồ sơ của Anh/Chị trong vòng 2 giờ làm việc.`,
      `2. Veylix áp dụng chính sách bảo vệ người mua 100%: hỗ trợ đổi mới miễn phí tận nơi hoặc hoàn tiền nhanh nếu sản phẩm phát sinh bất kỳ lỗi kỹ thuật nào.`,
      `3. Gửi tặng Anh/Chị mã **HELLO10** cho lần mua sắm tiếp theo như lời cảm ơn sự đồng hành của Anh/Chị.`,
      '',
      `Nếu cần hỗ trợ tức thời, Anh/Chị có thể nhắn trực tiếp qua khung Live Chat tại trang chủ. Chúc Anh/Chị một ngày tốt lành!\n— Chuyên viên CSKH Veylix (${tone})`
    ].join('\n');
  } else {
    title = `Bài đăng Mạng xã hội: ${pName}`;
    content = [
      `🌿 ÍT HƠN NHƯNG TINH TẾ HƠN — CÙNG ${pName.toUpperCase()}`,
      '',
      `${pDesc}`,
      `Đáp ứng trọn vẹn tinh thần "${prompt}" với mức giá chỉ ${pPrice}. Từng đường nét được hoàn thiện tỉ mỉ để đồng hành cùng bạn từ góc làm việc đến những chuyến đi xa.`,
      '',
      `✔️ Hàng sẵn kho — Giao nhanh toàn quốc`,
      `✔️ Nhập mã HELLO10 giảm ngay 10% tại Website chính thức`,
      `👉 Đặt mua ngay tại: /store/products/${pSku}`,
      '',
      `#VeylixStudio #MinimalLifestyle #${pSku.replace(/-/g, '')} #PhongCachToiGian`
    ].join('\n');
  }

  const historyRecord = await ModuleRecord.create({
    moduleSlug: 'ai-history',
    name: title,
    code: `AI-${Date.now().toString().slice(-5)}`,
    date: `Hôm nay, ${formatViTime()}`,
    status: 'Hoạt động',
    statusClass: 'green',
    count: content.length,
    value: type.toUpperCase(),
    subtitle: `Giọng văn: ${tone} · SP: ${pName}`,
    category: type,
    owner: 'AI Studio',
    notes: content
  });

  return sendCreated(res, {
    id: historyRecord.id,
    type,
    tone,
    prompt,
    productName: pName,
    title,
    content,
    createdAt: historyRecord.date,
    historyRecord
  });
});

// ==========================================
// 4. TEAM MEMBERS (USERS)
// ==========================================

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await TeamMember.find().sort({ createdAt: 1 });
  return sendSuccess(res, users, { total: users.length });
});

export const createUser = asyncHandler(async (req, res) => {
  const name = requireNonEmptyString(req.body.name, 'họ và tên thành viên', 'name');
  const email = requireValidEmail(req.body.email, 'email công việc', 'email');

  if (await TeamMember.exists({ email })) {
    throw new AppError(
      `Thành viên với email "${email}" đã tồn tại trong đội ngũ.`,
      409,
      'CONFLICT',
      [{ field: 'email', message: 'Email thành viên bị trùng lặp' }]
    );
  }

  const role =
    req.body.role && String(req.body.role).trim()
      ? String(req.body.role).trim()
      : 'Chuyên viên CSKH';

  const user = await TeamMember.create({
    name,
    email,
    role,
    status: 'Active',
    avatar: makeAvatarInitials(name, 'NV'),
    lastActive: 'Vừa mời'
  });

  return sendCreated(res, user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await TeamMember.findById(req.params.id);
  if (!user) {
    throw new AppError('Không tìm thấy thành viên nhóm cần cập nhật.', 404, 'NOT_FOUND');
  }

  if (req.body.name === undefined && req.body.role === undefined && req.body.status === undefined) {
    throw new AppError('Vui lòng cung cấp thông tin cần cập nhật (name, role hoặc status).', 400, 'VALIDATION_ERROR');
  }

  const isOwner = user.role === 'Chủ sở hữu (Owner)' || String(user.role).includes('Owner');

  const updateFields = {};

  if (req.body.role !== undefined) {
    const nextRole = requireNonEmptyString(req.body.role, 'vai trò phân quyền', 'role');
    if (isOwner && nextRole !== user.role && !nextRole.includes('Owner')) {
      throw new AppError(
        'Không được phép hạ quyền tài khoản Chủ sở hữu (Owner) của cửa hàng.',
        400,
        'FORBIDDEN_OWNER_MODIFY'
      );
    }
    updateFields.role = nextRole;
  }

  if (req.body.status !== undefined) {
    const nextStatus = requireEnum(
      req.body.status,
      ['Active', 'Invited', 'Disabled'],
      'Trạng thái thành viên',
      'status'
    );
    if (isOwner && nextStatus !== 'Active') {
      throw new AppError(
        'Không được phép khóa hoặc vô hiệu hóa tài khoản Chủ sở hữu (Owner) của cửa hàng.',
        400,
        'FORBIDDEN_OWNER_MODIFY'
      );
    }
    updateFields.status = nextStatus;
    if (nextStatus === 'Disabled') {
      updateFields.lastActive = 'Đang tạm khóa';
    } else if (user.status === 'Disabled' && nextStatus === 'Active') {
      updateFields.lastActive = 'Vừa mở khóa';
    }
  }

  if (req.body.name !== undefined) {
    const nextName = requireNonEmptyString(req.body.name, 'họ và tên thành viên', 'name');
    updateFields.name = nextName;
    updateFields.avatar = makeAvatarInitials(nextName, 'NV');
  }

  const updatedUser = await TeamMember.findByIdAndUpdate(
    user._id,
    { $set: updateFields },
    { new: true, runValidators: false }
  );

  return sendSuccess(res, updatedUser);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await TeamMember.findById(req.params.id);
  if (!user) {
    throw new AppError('Không tìm thấy thành viên nhóm cần xóa.', 404, 'NOT_FOUND');
  }

  if (user.role === 'Chủ sở hữu (Owner)' || String(user.role).includes('Owner')) {
    throw new AppError(
      'Không được phép xóa tài khoản Chủ sở hữu (Owner) của cửa hàng.',
      400,
      'FORBIDDEN_OWNER_DELETE'
    );
  }

  await TeamMember.deleteOne({ _id: user._id });
  return sendSuccess(res, { id: user.id, deleted: true });
});

// ==========================================
// 5. STORE SETTINGS
// ==========================================

const DEFAULT_SETTINGS_DATA = {
  key: 'general',
  storeName: 'Veylix Store',
  tagline: 'Thương mại trong sự hài hòa',
  supportEmail: 'support@veylix.vn',
  supportPhone: '+84 28 3822 1234',
  currency: 'USD ($)',
  timezone: 'Asia/Ho_Chi_Minh (GMT+7)',
  language: 'Tiếng Việt',
  taxRate: 8,
  address: 'Tầng 12, Tòa nhà Bitexco, Quận 1',
  city: 'TP. Hồ Chí Minh',
  country: 'Việt Nam',
  allowGuestCheckout: true,
  autoFulfill: false,
  currentUser: {
    name: 'Alex Chen',
    role: 'Quản trị viên cửa hàng',
    email: 'alex.chen@veylix.vn',
    avatarLetter: 'A'
  }
};

export const getSettings = asyncHandler(async (_req, res) => {
  let settings = await StoreSetting.findOne({ key: 'general' });
  if (!settings) {
    settings = await StoreSetting.create(DEFAULT_SETTINGS_DATA);
  }
  return sendSuccess(res, settings);
});

export const updateSettings = asyncHandler(async (req, res) => {
  let current = await StoreSetting.findOne({ key: 'general' });
  if (!current) {
    current = await StoreSetting.create(DEFAULT_SETTINGS_DATA);
  }

  const storeName =
    req.body.storeName !== undefined
      ? requireNonEmptyString(req.body.storeName, 'tên cửa hàng', 'storeName')
      : current.storeName;

  const supportEmail =
    req.body.supportEmail !== undefined
      ? requireValidEmail(req.body.supportEmail, 'email hỗ trợ CSKH', 'supportEmail')
      : current.supportEmail;

  const taxRate =
    req.body.taxRate !== undefined
      ? optionalNumber(req.body.taxRate, current.taxRate, {
          min: 0,
          max: 100,
          fieldLabel: 'Thuế suất VAT (%)',
          fieldName: 'taxRate'
        })
      : current.taxRate;

  const updatePayload = {
    storeName,
    supportEmail,
    taxRate
  };

  const optionalStringFields = [
    'tagline',
    'supportPhone',
    'currency',
    'timezone',
    'language',
    'address',
    'city',
    'country'
  ];
  for (const field of optionalStringFields) {
    if (req.body[field] !== undefined) {
      updatePayload[field] = String(req.body[field]).trim();
    }
  }

  if (req.body.allowGuestCheckout !== undefined) {
    updatePayload.allowGuestCheckout = Boolean(req.body.allowGuestCheckout);
  }
  if (req.body.autoFulfill !== undefined) {
    updatePayload.autoFulfill = Boolean(req.body.autoFulfill);
  }
  if (req.body.currentUser && typeof req.body.currentUser === 'object') {
    updatePayload.currentUser = req.body.currentUser;
  }

  const settings = await StoreSetting.findOneAndUpdate(
    { key: 'general' },
    { $set: updatePayload },
    { new: true, runValidators: true }
  );

  return sendSuccess(res, settings);
});

// ==========================================
// 6. MODULE CONFIGS (DEEP SETTINGS & PERMISSIONS)
// ==========================================

export const DEFAULT_MODULE_CONFIGS = {
  store: {
    title: 'Cửa hàng trực tuyến (Storefront)',
    group: 'Cửa hàng trực tuyến',
    settings: {
      announcementEnabled: true,
      announcementText: 'Miễn phí vận chuyển cho đơn từ $75 · Nhập mã HELLO10 giảm ngay 10% đơn đầu tiên!',
      heroBadge: 'BỘ SƯU TẬP MỚI 2026',
      heroTitle: 'Thiết kế tối giản cho nhịp sống hài hòa',
      heroSubtitle: 'Khám phá trang phục thiết yếu, phụ kiện du lịch và vật dụng không gian sống bền vững từ Veylix Studio.',
      primaryCtaText: 'Khám phá sản phẩm',
      accentColor: '#b87d14',
      featuredCount: 8,
      showReviewsSection: true,
      showCouponsSection: true,
      defaultUiStyle: 'veylix',
      defaultColorTheme: 'veylix',
      defaultColorMode: 'light'
    }
  },
  'settings-maintenance': {
    title: 'Chế độ bảo trì hệ thống',
    group: 'Cài đặt hệ thống',
    settings: {
      enabled: false,
      headline: 'Veylix Store đang nâng cấp trải nghiệm mua sắm',
      message: 'Cửa hàng đang bảo trì định kỳ để cập nhật bộ sưu tập mới. Quý khách vui lòng quay lại sau ít phút.',
      reopenAt: '2026-12-01 08:00',
      allowAdminBypass: true,
      contactEmail: 'support@veylix.vn'
    }
  },
  'settings-seo': {
    title: 'Tối ưu SEO cửa hàng',
    group: 'Cài đặt hệ thống',
    settings: {
      metaTitle: 'Veylix Studio — Thời trang & Phụ kiện Tối giản Cao cấp',
      metaDescription: 'Mua sắm quần áo cơ bản, balo chống nước, gốm sứ thủ công và phụ kiện bàn làm việc tinh tế tại Veylix Store.',
      ogImage: '/assets/images/products/minimal-backpack.png',
      canonicalDomain: 'https://veylix.vn',
      sitemapEnabled: true,
      robotsIndex: true,
      structuredDataJsonLd: true
    }
  },
  'settings-branding': {
    title: 'Thương hiệu & Nhận diện',
    group: 'Cài đặt hệ thống',
    settings: {
      brandName: 'Veylix Studio',
      slogan: 'Commerce in Harmony',
      primaryColor: '#25211d',
      accentColor: '#b87d14',
      surfaceColor: '#f6f1e7',
      headingFont: 'Manrope',
      borderRadiusStyle: 'Bo tròn mềm mại (14px)',
      showBrandWatermark: false
    }
  },
  'settings-localization': {
    title: 'Ngôn ngữ & Tiền tệ khu vực',
    group: 'Cài đặt hệ thống',
    settings: {
      defaultLanguage: 'vi',
      supportedLanguages: ['vi', 'en', 'fr'],
      defaultCurrency: 'USD',
      exchangeRateVnd: 25400,
      dateFormat: 'DD/MM/YYYY',
      weightUnit: 'kg',
      autoDetectGeoIp: true
    }
  },
  taxes: {
    title: 'Quy định thuế & Hóa đơn',
    group: 'Cài đặt hệ thống',
    settings: {
      vatRate: 8,
      importDutyRate: 0,
      pricesIncludeTax: false,
      taxOnShipping: false,
      autoIssueEInvoice: true,
      companyTaxId: '0316892410'
    }
  },
  'shipping-rules': {
    title: 'Vùng vận chuyển & Biểu phí',
    group: 'Cài đặt hệ thống',
    settings: {
      standardFee: 5,
      expressFee: 8,
      dhlExpressFee: 15,
      freeShippingThreshold: 75,
      enableFreeShippingBanner: true,
      estimatedDomesticDays: '2 - 3 ngày làm việc',
      defaultWarehouse: 'NY'
    }
  },
  'settings-security': {
    title: 'Bảo mật tài khoản & Phiên',
    group: 'Cài đặt hệ thống',
    settings: {
      enforceTwoFactor: true,
      sessionTimeoutMinutes: 120,
      passwordMinLength: 10,
      loginAlertEmail: true,
      ipRateLimitPerMinute: 120,
      auditLogRetentionDays: 90
    }
  },
  permissions: {
    title: 'Ma trận phân quyền vai trò',
    group: 'Nhân sự & Phân quyền',
    settings: {
      roles: ['Owner', 'Quản lý kho', 'CSKH', 'Tiếp thị', 'Kế toán'],
      matrix: {
        products_view: { Owner: true, 'Quản lý kho': true, CSKH: true, 'Tiếp thị': true, 'Kế toán': true },
        products_manage: { Owner: true, 'Quản lý kho': true, CSKH: false, 'Tiếp thị': true, 'Kế toán': false },
        orders_view: { Owner: true, 'Quản lý kho': true, CSKH: true, 'Tiếp thị': false, 'Kế toán': true },
        orders_manage: { Owner: true, 'Quản lý kho': true, CSKH: true, 'Tiếp thị': false, 'Kế toán': false },
        inventory_manage: { Owner: true, 'Quản lý kho': true, CSKH: false, 'Tiếp thị': false, 'Kế toán': false },
        customers_manage: { Owner: true, 'Quản lý kho': false, CSKH: true, 'Tiếp thị': true, 'Kế toán': false },
        finance_refund: { Owner: true, 'Quản lý kho': false, CSKH: false, 'Tiếp thị': false, 'Kế toán': true },
        settings_manage: { Owner: true, 'Quản lý kho': false, CSKH: false, 'Tiếp thị': false, 'Kế toán': false }
      }
    }
  }
};

function buildFallbackModuleConfig(slug) {
  if (DEFAULT_MODULE_CONFIGS[slug]) {
    return DEFAULT_MODULE_CONFIGS[slug];
  }
  return {
    title: `Cấu hình ${slug}`,
    group: 'Cài đặt chuyên sâu',
    settings: {
      enabled: true,
      autoSync: true,
      notificationAlert: true,
      mode: 'Tiêu chuẩn',
      threshold: 50,
      contactEmail: 'ops@veylix.vn',
      notes: `Thiết lập vận hành mặc định cho phân hệ ${slug}.`
    }
  };
}

const ALLOWED_STORE_STYLES = ['veylix', 'glass', 'liquid-glass', 'flat'];
const ALLOWED_STORE_THEMES = ['veylix', 'xanh-rung', 'xanh-duong', 'hong', 'tim', 'cam'];

export function normalizeStorefrontStyleSettings(settings = {}) {
  const rawStyle = String(settings.defaultUiStyle || '').trim();
  const rawTheme = String(settings.defaultColorTheme || '').trim();
  const rawMode = String(settings.defaultColorMode || '').trim();

  return {
    ...settings,
    defaultUiStyle: ALLOWED_STORE_STYLES.includes(rawStyle) ? rawStyle : 'veylix',
    defaultColorTheme: ALLOWED_STORE_THEMES.includes(rawTheme) ? rawTheme : 'veylix',
    defaultColorMode: rawMode === 'dark' ? 'dark' : 'light'
  };
}

export const getModuleConfig = asyncHandler(async (req, res) => {
  const slug = requireNonEmptyString(req.params.slug, 'mã phân hệ cấu hình (slug)', 'slug').toLowerCase();
  let configDoc = await ModuleConfig.findOne({ slug });

  if (!configDoc) {
    const def = buildFallbackModuleConfig(slug);
    configDoc = await ModuleConfig.create({
      slug,
      title: def.title,
      group: def.group,
      settings: slug === 'store' ? normalizeStorefrontStyleSettings(def.settings) : def.settings,
      updatedBy: 'Alex Chen'
    });
  } else if (slug === 'store') {
    const cur = configDoc.settings || {};
    const normalized = normalizeStorefrontStyleSettings(cur);
    if (
      cur.defaultUiStyle !== normalized.defaultUiStyle ||
      cur.defaultColorTheme !== normalized.defaultColorTheme ||
      cur.defaultColorMode !== normalized.defaultColorMode
    ) {
      configDoc.settings = normalized;
      configDoc.markModified('settings');
      await configDoc.save();
    }
  }

  return sendSuccess(res, configDoc);
});

export const updateModuleConfig = asyncHandler(async (req, res) => {
  const slug = requireNonEmptyString(req.params.slug, 'mã phân hệ cấu hình (slug)', 'slug').toLowerCase();
  const def = buildFallbackModuleConfig(slug);

  let nextSettings = req.body.settings;
  if (req.body.reset === true) {
    nextSettings = def.settings;
  }

  if (!nextSettings || typeof nextSettings !== 'object' || Array.isArray(nextSettings)) {
    throw new AppError('Dữ liệu cấu hình (settings) phải là một đối tượng hợp lệ.', 400, 'VALIDATION_ERROR');
  }

  if (slug === 'store') {
    nextSettings = normalizeStorefrontStyleSettings(nextSettings);
  }

  const title =
    req.body.title && String(req.body.title).trim()
      ? String(req.body.title).trim()
      : def.title;
  const updatedBy =
    req.body.updatedBy && String(req.body.updatedBy).trim()
      ? String(req.body.updatedBy).trim()
      : 'Alex Chen';

  let configDoc = await ModuleConfig.findOne({ slug });
  if (configDoc) {
    configDoc.title = title;
    if (req.body.group) configDoc.group = String(req.body.group).trim();
    configDoc.settings = nextSettings;
    configDoc.updatedBy = updatedBy;
    configDoc.markModified('settings');
    await configDoc.save();
  } else {
    configDoc = await ModuleConfig.create({
      slug,
      title,
      group: req.body.group ? String(req.body.group).trim() : def.group,
      settings: nextSettings,
      updatedBy
    });
  }

  // Ghi nhận tự động vào nhật ký hoạt động hệ thống (moduleSlug: 'audit')
  await ModuleRecord.create({
    moduleSlug: 'audit',
    name: req.body.reset
      ? `Khôi phục mặc định cấu hình: ${configDoc.title}`
      : `Cập nhật cấu hình: ${configDoc.title}`,
    code: `AUD-${Date.now().toString().slice(-6)}`,
    date: `Hôm nay, ${formatViTime()}`,
    status: 'Hoạt động',
    statusClass: 'green',
    count: Object.keys(nextSettings).length,
    value: slug,
    subtitle: `Thực hiện bởi ${updatedBy}`,
    category: 'Cấu hình & Bảo mật',
    owner: updatedBy,
    notes: `Đã lưu ${Object.keys(nextSettings).length} tham số cấu hình cho phân hệ "${slug}".`
  });

  return sendSuccess(res, configDoc);
});

// ==========================================
// 7. DYNAMIC MODULES (45+ SUB-PAGES)
// ==========================================

const MODULE_STATUS_CLASS = {
  'Hoạt động': 'green',
  'Đang hoạt động': 'green',
  'Đã duyệt': 'green',
  'Đã gửi': 'green',
  'Thành công': 'green',
  'Đang xử lý': 'amber',
  'Chờ duyệt': 'amber',
  'Sắp hết': 'amber',
  'Đã hoàn tất': 'blue',
  'Mới tiếp nhận': 'blue',
  'Lưu trữ': 'purple',
  'Tạm dừng': 'red',
  'Đã hủy': 'red',
  'Từ chối': 'red'
};

export const getModuleRecords = asyncHandler(async (req, res) => {
  const slug = requireNonEmptyString(req.params.slug, 'phân hệ nghiệp vụ (slug)', 'slug').toLowerCase();
  const { search, title, status } = req.query;

  const existingCount = await ModuleRecord.countDocuments({ moduleSlug: slug });
  if (existingCount === 0) {
    const moduleTitle = title && String(title).trim() ? String(title).trim() : `Phân hệ ${slug}`;
    const codePrefix = `VX-${slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'MOD'}`;

    const seedItems = [
      {
        moduleSlug: slug,
        name: `${moduleTitle} — Hạng mục tiêu chuẩn A`,
        code: `${codePrefix}-01`,
        date: 'Hôm nay',
        status: 'Hoạt động',
        statusClass: 'green',
        count: 124,
        value: '$1,250',
        subtitle: 'Áp dụng toàn hệ thống Veylix',
        category: moduleTitle,
        owner: 'Alex Chen',
        notes: 'Đang vận hành ổn định theo quy chuẩn cửa hàng.'
      },
      {
        moduleSlug: slug,
        name: `${moduleTitle} — Khu vực TP. Hồ Chí Minh`,
        code: `${codePrefix}-02`,
        date: 'Hôm qua',
        status: 'Hoạt động',
        statusClass: 'green',
        count: 86,
        value: '$920',
        subtitle: 'Chi nhánh miền Nam',
        category: moduleTitle,
        owner: 'Trần Mai Phương',
        notes: 'Đồng bộ dữ liệu tự động mỗi 15 phút.'
      },
      {
        moduleSlug: slug,
        name: `${moduleTitle} — Đợt rà soát định kỳ`,
        code: `${codePrefix}-03`,
        date: '28 Thg 4',
        status: 'Đang xử lý',
        statusClass: 'amber',
        count: 45,
        value: '$450',
        subtitle: 'Đang chờ xác nhận đối soát',
        category: moduleTitle,
        owner: 'Lê Hoàng Nam',
        notes: 'Cần kiểm tra bổ sung trước khi khóa sổ.'
      },
      {
        moduleSlug: slug,
        name: `${moduleTitle} — Lô nghiệp vụ Quý 1`,
        code: `${codePrefix}-04`,
        date: '25 Thg 4',
        status: 'Đã hoàn tất',
        statusClass: 'blue',
        count: 32,
        value: '$310',
        subtitle: 'Đã nghiệm thu hoàn chỉnh',
        category: moduleTitle,
        owner: 'Nguyễn Tuấn Kiệt',
        notes: 'Hoàn thành 100% chỉ tiêu đề ra.'
      },
      {
        moduleSlug: slug,
        name: `${moduleTitle} — Bản ghi lưu trữ mẫu`,
        code: `${codePrefix}-05`,
        date: '22 Thg 4',
        status: 'Lưu trữ',
        statusClass: 'purple',
        count: 18,
        value: '$180',
        subtitle: 'Dữ liệu tham khảo lịch sử',
        category: moduleTitle,
        owner: 'Alex Chen',
        notes: 'Lưu trữ phục vụ tra cứu nội bộ.'
      }
    ];

    await ModuleRecord.insertMany(seedItems);
  }

  const filter = { moduleSlug: slug };
  if (status && status !== 'all') {
    filter.status = status;
  }
  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    filter.$or = [
      { name: rx },
      { code: rx },
      { status: rx },
      { subtitle: rx },
      { category: rx },
      { owner: rx },
      { notes: rx }
    ];
  }

  const records = await ModuleRecord.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, records, { moduleSlug: slug, total: records.length });
});

export const createModuleRecord = asyncHandler(async (req, res) => {
  const slug = requireNonEmptyString(req.params.slug, 'phân hệ nghiệp vụ (slug)', 'slug').toLowerCase();

  // Hỗ trợ cả form liên hệ / đăng ký nhận bản tin từ Storefront gửi vào /api/modules/contacts
  const derivedName =
    req.body.name && String(req.body.name).trim()
      ? String(req.body.name).trim()
      : slug === 'contacts' && req.body.email
      ? `Đăng ký bản tin: ${String(req.body.email).trim()}`
      : '';

  const name = requireNonEmptyString(derivedName, 'tên bản ghi', 'name');
  const status =
    req.body.status && String(req.body.status).trim()
      ? String(req.body.status).trim()
      : slug === 'contacts'
      ? 'Đang xử lý'
      : 'Hoạt động';
  const statusClass =
    req.body.statusClass || MODULE_STATUS_CLASS[status] || 'green';

  const codePrefix = `VX-${slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'MOD'}`;
  const code =
    req.body.code && String(req.body.code).trim()
      ? String(req.body.code).trim().toUpperCase()
      : `${codePrefix}-${Math.floor(100 + Math.random() * 900)}`;

  const count = Math.round(optionalNumber(req.body.count, 0, { min: 0 }));
  const rawVal =
    req.body.value !== undefined && req.body.value !== ''
      ? String(req.body.value).trim()
      : req.body.email
      ? String(req.body.email).trim()
      : '$0';
  const value =
    rawVal.includes('@') || rawVal.startsWith('$') || Number.isNaN(Number(rawVal))
      ? rawVal
      : `$${rawVal}`;

  const record = await ModuleRecord.create({
    moduleSlug: slug,
    name,
    code,
    date: req.body.date || 'Vừa xong',
    status,
    statusClass,
    count,
    value,
    subtitle: String(req.body.subtitle ?? req.body.email ?? req.body.subject ?? '').trim(),
    category: String(req.body.category ?? req.body.subject ?? '').trim(),
    owner: String(req.body.owner ?? (slug === 'contacts' ? 'Storefront' : 'Alex Chen')).trim(),
    notes: String(req.body.notes ?? req.body.message ?? '').trim(),
    meta: req.body.meta && typeof req.body.meta === 'object' ? req.body.meta : {}
  });

  return sendCreated(res, record);
});

export const updateModuleRecord = asyncHandler(async (req, res) => {
  const slug = requireNonEmptyString(req.params.slug, 'phân hệ nghiệp vụ (slug)', 'slug').toLowerCase();
  const record = await ModuleRecord.findOne({ _id: req.params.id, moduleSlug: slug });
  if (!record) {
    throw new AppError('Không tìm thấy bản ghi cần chỉnh sửa trong phân hệ này.', 404, 'NOT_FOUND');
  }

  if (req.body.name !== undefined) {
    record.name = requireNonEmptyString(req.body.name, 'tên bản ghi', 'name');
  }
  if (req.body.code !== undefined && String(req.body.code).trim()) {
    record.code = String(req.body.code).trim().toUpperCase();
  }
  if (req.body.status !== undefined && String(req.body.status).trim()) {
    record.status = String(req.body.status).trim();
    record.statusClass =
      req.body.statusClass || MODULE_STATUS_CLASS[record.status] || record.statusClass || 'green';
  } else if (req.body.statusClass !== undefined) {
    record.statusClass = String(req.body.statusClass).trim();
  }
  if (req.body.count !== undefined) {
    record.count = Math.round(requireNumber(req.body.count, 'Số lượng', { min: 0 }));
  }
  if (req.body.value !== undefined) {
    record.value = String(req.body.value).trim();
  }
  if (req.body.subtitle !== undefined) {
    record.subtitle = String(req.body.subtitle).trim();
  }
  if (req.body.category !== undefined) {
    record.category = String(req.body.category).trim();
  }
  if (req.body.owner !== undefined) {
    record.owner = String(req.body.owner).trim();
  }
  if (req.body.notes !== undefined) {
    record.notes = String(req.body.notes).trim();
  }
  if (req.body.meta !== undefined && typeof req.body.meta === 'object') {
    record.meta = req.body.meta;
    record.markModified('meta');
  }
  record.date = req.body.date || 'Vừa cập nhật';

  await record.save();
  return sendSuccess(res, record);
});

export const bulkDeleteModuleRecords = asyncHandler(async (req, res) => {
  const slug = requireNonEmptyString(req.params.slug, 'phân hệ nghiệp vụ (slug)', 'slug').toLowerCase();
  const ids = requireIdsArray(req.body.ids, 'bản ghi');

  const result = await ModuleRecord.deleteMany({
    moduleSlug: slug,
    _id: { $in: ids }
  });

  return sendSuccess(res, {
    deletedCount: result.deletedCount,
    ids
  });
});

export const bulkUpdateModuleStatus = asyncHandler(async (req, res) => {
  const slug = requireNonEmptyString(req.params.slug, 'phân hệ nghiệp vụ (slug)', 'slug').toLowerCase();
  const ids = requireIdsArray(req.body.ids, 'bản ghi');
  const status = requireNonEmptyString(req.body.status, 'trạng thái mới', 'status');
  const statusClass = req.body.statusClass || MODULE_STATUS_CLASS[status] || 'green';

  const result = await ModuleRecord.updateMany(
    { moduleSlug: slug, _id: { $in: ids } },
    { $set: { status, statusClass, date: 'Vừa cập nhật' } }
  );

  return sendSuccess(res, {
    updatedCount: result.modifiedCount,
    status,
    statusClass,
    ids
  });
});

export const deleteModuleRecord = asyncHandler(async (req, res) => {
  const slug = requireNonEmptyString(req.params.slug, 'phân hệ nghiệp vụ (slug)', 'slug').toLowerCase();
  const record = await ModuleRecord.findOneAndDelete({
    _id: req.params.id,
    moduleSlug: slug
  });

  if (!record) {
    throw new AppError('Không tìm thấy bản ghi cần xóa trong phân hệ này.', 404, 'NOT_FOUND');
  }

  return sendSuccess(res, { id: record.id, deleted: true });
});
