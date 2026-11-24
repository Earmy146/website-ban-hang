import {
  Order,
  Shipment,
  Transaction,
  Product,
  StockItem,
  Customer,
  Vendor,
  Coupon,
  ModuleRecord
} from '../models/index.js';
import { AppError, asyncHandler, sendSuccess } from '../utils/apiResponse.js';

const CHANNEL_META = [
  {
    matchKeys: ['Cửa hàng trực tuyến', 'Website trực tuyến'],
    displayOverview: 'Website trực tuyến',
    displayReport: 'Website trực tuyến',
    color: '#10b981',
    icon: '🌐',
    growth: '+14.2%',
    baseWeight: 0.42
  },
  {
    matchKeys: ['Ứng dụng di động', 'Ứng dụng di động (Mobile App)', 'Mobile App'],
    displayOverview: 'Ứng dụng di động',
    displayReport: 'Ứng dụng di động (Mobile App)',
    color: '#3b82f6',
    icon: '📱',
    growth: '+8.6%',
    baseWeight: 0.28
  },
  {
    matchKeys: ['Sàn thương mại', 'Sàn thương mại điện tử'],
    displayOverview: 'Sàn thương mại',
    displayReport: 'Sàn thương mại điện tử',
    color: '#f59e0b',
    icon: '🏬',
    growth: '+5.1%',
    baseWeight: 0.20
  },
  {
    matchKeys: ['Mạng xã hội (Social)', 'Mạng xã hội', 'Social'],
    displayOverview: 'Mạng xã hội (Social)',
    displayReport: 'Bán hàng mạng xã hội (Social)',
    color: '#8b5cf6',
    icon: '💬',
    growth: '+22.4%',
    baseWeight: 0.10
  }
];

const SHIPMENT_STATUS_VI = {
  Pending: 'Chờ lấy hàng',
  Packaging: 'Đang đóng gói',
  'Out for delivery': 'Đang giao hàng',
  Delivered: 'Đã giao thành công',
  Delayed: 'Chậm trễ giao'
};

const PERIOD_FACTORS = {
  '7': { mult: 0.27, delta: '+8.4%', conv: '3.50%', growthText: '+8.4% so với 7 ngày trước' },
  '30': { mult: 1.0, delta: '+12.6%', conv: '3.42%', growthText: '+12.4% so với 30 ngày trước' },
  '90': { mult: 2.85, delta: '+15.2%', conv: '3.38%', growthText: '+15.2% so với quý trước' },
  '365': { mult: 4.1, delta: '+18.1%', conv: '3.40%', growthText: '+18.1% so với cùng kỳ năm ngoái' }
};

const VALID_REPORT_TYPES = [
  'sales',
  'orders',
  'products',
  'inventory',
  'customers',
  'returns',
  'channels',
  'payments',
  'vendors',
  'marketing'
];

export const getOverview = asyncHandler(async (req, res) => {
  const period = String(req.query.period || '30');
  const chartRange = String(req.query.chartRange || '30');

  if (!['7', '30', '90', '365'].includes(period)) {
    throw new AppError('Kỳ thống kê (period) chỉ chấp nhận 7, 30, 90 hoặc 365 ngày.', 400, 'VALIDATION_ERROR');
  }
  if (!['7', '30'].includes(chartRange)) {
    throw new AppError('Phạm vi biểu đồ (chartRange) chỉ chấp nhận 7 hoặc 30 ngày.', 400, 'VALIDATION_ERROR');
  }

  const [allOrders, recentOrderDocs, shipmentDocs, productDocs] = await Promise.all([
    Order.find({ fulfillmentStatus: { $ne: 'Cancelled' } }).lean(),
    Order.find({ fulfillmentStatus: { $ne: 'Cancelled' } }).sort({ createdAt: -1 }).limit(6),
    Shipment.find().sort({ createdAt: -1 }).limit(5),
    Product.find({ isDeleted: { $ne: true } }).select('revenue sales').lean()
  ]);

  const factorCfg = PERIOD_FACTORS[period] || PERIOD_FACTORS['30'];
  const dbOrdersTotal = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const catalogRevenue = productDocs.reduce((sum, p) => sum + (Number(p.revenue) || 0), 0);

  const base30Gmv = Math.round((catalogRevenue > 0 ? catalogRevenue * 0.35 : 67800) + dbOrdersTotal);
  const gmvValue = Math.max(Math.round(base30Gmv * factorCfg.mult), Math.round(dbOrdersTotal));
  const totalOrdersPeriod = Math.max(Math.round((1240 + allOrders.length) * factorCfg.mult), allOrders.length);
  const aovValue = totalOrdersPeriod > 0 ? gmvValue / totalOrdersPeriod : 0;

  const baseBars = [35, 52, 44, 68, 85, 72, 95, 80, 110, 98, 125, 118];
  const bars = baseBars.map((v, idx) =>
    Math.max(12, Math.round(v * (0.7 + factorCfg.mult * 0.3) + (idx === baseBars.length - 1 ? allOrders.length * 2 : 0)))
  );

  const scaleChart = Math.max(0.6, gmvValue / 68420);
  const points =
    chartRange === '7'
      ? [
          { label: '24 Th4', val1: Math.round(54 * scaleChart), val2: Math.round(44 * scaleChart) },
          { label: '25 Th4', val1: Math.round(62 * scaleChart), val2: Math.round(49 * scaleChart) },
          { label: '26 Th4', val1: Math.round(58 * scaleChart), val2: Math.round(52 * scaleChart) },
          { label: '27 Th4', val1: Math.round(79 * scaleChart), val2: Math.round(61 * scaleChart) },
          { label: '28 Th4', val1: Math.round(86 * scaleChart), val2: Math.round(68 * scaleChart) },
          { label: '29 Th4', val1: Math.round(95 * scaleChart), val2: Math.round(74 * scaleChart) },
          { label: '30 Th4', val1: Math.round(108 * scaleChart), val2: Math.round(82 * scaleChart) }
        ]
      : [
          { label: '01 Th4', val1: Math.round(42 * scaleChart), val2: Math.round(30 * scaleChart) },
          { label: '05 Th4', val1: Math.round(58 * scaleChart), val2: Math.round(45 * scaleChart) },
          { label: '10 Th4', val1: Math.round(52 * scaleChart), val2: Math.round(50 * scaleChart) },
          { label: '15 Th4', val1: Math.round(75 * scaleChart), val2: Math.round(60 * scaleChart) },
          { label: '20 Th4', val1: Math.round(68 * scaleChart), val2: Math.round(65 * scaleChart) },
          { label: '25 Th4', val1: Math.round(92 * scaleChart), val2: Math.round(70 * scaleChart) },
          { label: '30 Th4', val1: Math.round(110 * scaleChart), val2: Math.round(85 * scaleChart) }
        ];

  const countProcessing = allOrders.filter((o) => o.fulfillmentStatus === 'Processing').length;
  const countPacked = allOrders.filter((o) => o.fulfillmentStatus === 'Packed').length;
  const countShipped = allOrders.filter((o) => o.fulfillmentStatus === 'Shipped').length;
  const countDelivered = allOrders.filter((o) => o.fulfillmentStatus === 'Delivered').length;
  const realTotal = Math.max(allOrders.length, 1);

  const steps = [
    { label: 'Đang xử lý', count: countProcessing, color: '#10b981', total: realTotal },
    { label: 'Đã đóng gói', count: countPacked, color: '#06b6d4', total: realTotal },
    { label: 'Đang giao hàng', count: countShipped, color: '#f59e0b', total: realTotal },
    { label: 'Đã giao thành công', count: countDelivered, color: '#8b5cf6', total: realTotal }
  ];

  const liveShipments = shipmentDocs.slice(0, 4).map((s) => {
    const json = s.toJSON();
    const shortDest = String(json.destination || '').split(',').pop()?.trim() || json.destination;
    return {
      id: json.id,
      orderId: json.orderId,
      status: json.statusText || SHIPMENT_STATUS_VI[json.status] || json.status,
      rawStatus: json.status,
      statusClass: json.statusClass || 'teal',
      time: json.createdAt || 'Hôm nay',
      dest: shortDest
    };
  });

  const channelRevMap = CHANNEL_META.map((ch) => {
    const matchedOrders = allOrders.filter((o) => ch.matchKeys.includes(o.channel));
    const realRev = matchedOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const weightedRev = Math.round(gmvValue * ch.baseWeight + realRev);
    return { ...ch, rawRev: weightedRev };
  });
  const sumChannelRev = channelRevMap.reduce((s, c) => s + c.rawRev, 0) || 1;

  const salesChannels = channelRevMap.map((c) => {
    const percent = Math.round((c.rawRev / sumChannelRev) * 100);
    return {
      name: c.displayOverview,
      percent,
      revenue: `$${c.rawRev.toLocaleString('en-US')}`,
      revenueRaw: c.rawRev,
      color: c.color,
      icon: c.icon
    };
  });

  const recentOrders = recentOrderDocs.map((o) => o.toJSON());

  return sendSuccess(
    res,
    {
      gmvCard: {
        gmv: `$${gmvValue.toLocaleString('en-US')}`,
        gmvRaw: gmvValue,
        delta: factorCfg.delta,
        conversionRate: factorCfg.conv,
        aov: `$${aovValue.toFixed(2)}`,
        bars
      },
      revenueChart: { points },
      operations: {
        totalOrders: allOrders.length,
        periodOrders: totalOrdersPeriod,
        steps
      },
      liveShipments,
      salesChannels,
      recentOrders
    },
    { period, chartRange }
  );
});

export const getReports = asyncHandler(async (req, res) => {
  const range = String(req.query.range || '30');
  if (!['7', '30', '90', '365'].includes(range)) {
    throw new AppError('Tham số kỳ báo cáo (range) không hợp lệ. Chỉ hỗ trợ 7, 30, 90 hoặc 365.', 400, 'VALIDATION_ERROR');
  }

  const rawType = String(req.query.type || 'sales').trim().toLowerCase().replace(/^report-/, '');
  const type = VALID_REPORT_TYPES.includes(rawType) ? rawType : 'sales';

  const [allOrders, transactions, products, stockItems, customers, vendors, coupons, returnRecords] =
    await Promise.all([
      Order.find().lean(),
      Transaction.find().lean(),
      Product.find({ isDeleted: { $ne: true } }).sort({ revenue: -1, sales: -1 }).lean(),
      StockItem.find().sort({ onHand: -1 }).lean(),
      Customer.find().sort({ totalSpent: -1 }).lean(),
      Vendor.find().sort({ sales: -1 }).lean(),
      Coupon.find().sort({ usageCount: -1 }).lean(),
      ModuleRecord.find({ moduleSlug: { $in: ['returns', 'refunds'] } }).lean()
    ]);

  const activeOrders = allOrders.filter((o) => o.fulfillmentStatus !== 'Cancelled');
  const factorCfg = PERIOD_FACTORS[range] || PERIOD_FACTORS['30'];
  const mult = factorCfg.mult;

  const succeededTxns = transactions.filter((t) => t.status === 'Succeeded');
  const txnNetTotal = succeededTxns.reduce((s, t) => s + (Number(t.net) || 0), 0);
  const txnGrossTotal = succeededTxns.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const channelData = CHANNEL_META.map((ch) => {
    const matched = activeOrders.filter((o) => ch.matchKeys.includes(o.channel));
    const dbCount = matched.length;
    const dbRev = matched.reduce((s, o) => s + (Number(o.total) || 0), 0);

    const baselineOrders30 = Math.round(1200 * ch.baseWeight);
    const baselineRev30 = Math.round(66000 * ch.baseWeight);

    const periodOrders = Math.max(dbCount, Math.round(baselineOrders30 * mult) + dbCount);
    const periodRevenue = +(Math.max(dbRev, Math.round(baselineRev30 * mult) + dbRev)).toFixed(2);
    const channelAov = periodOrders > 0 ? +(periodRevenue / periodOrders).toFixed(2) : 0;

    return {
      channel: ch.displayReport,
      orders: periodOrders,
      revenue: periodRevenue,
      aov: channelAov,
      growth: ch.growth
    };
  });

  const totalRevenue = +channelData.reduce((s, c) => s + c.revenue, 0).toFixed(2);
  const totalOrders = channelData.reduce((s, c) => s + c.orders, 0);
  const aov = totalOrders > 0 ? +(totalRevenue / totalOrders).toFixed(2) : 0;
  const feeRatio = txnGrossTotal > 0 ? (txnGrossTotal - txnNetTotal) / txnGrossTotal : 0.025;
  const grossMarginVal = (44.0 - feeRatio * 45 + (range === '90' ? 1.1 : range === '7' ? -0.6 : 0)).toFixed(1);

  let breakdownRows = [];
  let kpis = [];
  let columns = ['Phân mục', 'Chỉ số chính', 'Giá trị quy đổi', 'Chi tiết phụ', 'Đánh giá'];

  if (type === 'products') {
    columns = ['Sản phẩm', 'Sản lượng bán', 'Doanh thu kỳ', 'Tồn kho hiện tại', 'Xu hướng'];
    const maxProdRev = Math.max(...products.map((p) => (Number(p.revenue) || 0) * mult), 1);
    breakdownRows = products.slice(0, 10).map((p) => {
      const scaledSales = Math.max(1, Math.round((Number(p.sales) || 12) * mult));
      const scaledRev = Math.round((Number(p.revenue) || p.price * scaledSales) * mult);
      return {
        name: `${p.name} (${p.sku})`,
        metric1: `${scaledSales.toLocaleString('en-US')} SP`,
        metric2: `$${scaledRev.toLocaleString('en-US')}`,
        metric3: `Còn ${p.inventory} chiếc · ★ ${p.rating || 4.8}`,
        badge: p.trend || '+6.5%',
        badgeClass: p.trendUp === false ? 'amber' : 'green',
        ratio: Math.max(8, Math.round((scaledRev / maxProdRev) * 100)),
        rawValue: scaledRev
      };
    });
    const sumUnits = products.reduce((s, p) => s + Math.round((Number(p.sales) || 0) * mult), 0);
    kpis = [
      { label: 'Doanh thu sản phẩm', value: `$${totalRevenue.toLocaleString('en-US')}`, subtext: factorCfg.growthText, tone: 'green' },
      { label: 'Tổng sản lượng bán ra', value: `${sumUnits.toLocaleString('en-US')} SP`, subtext: `${products.length} mặt hàng đang bán`, tone: 'blue' },
      { label: 'Điểm đánh giá TB', value: '4.8 / 5.0', subtext: '96% phản hồi tích cực', tone: 'amber' },
      { label: 'Tỷ lệ luân chuyển kho', value: '84.6%', subtext: 'Hiệu suất bán hàng tốt', tone: 'green' }
    ];
  } else if (type === 'orders') {
    columns = ['Trạng thái đơn hàng', 'Số lượng đơn', 'Giá trị đơn hàng', 'Tỷ trọng đơn', 'Mức xử lý'];
    const statuses = [
      { key: 'Delivered', label: 'Đã giao thành công', badge: 'Hoàn tất SLA', badgeClass: 'green', weight: 0.52 },
      { key: 'Shipped', label: 'Đang giao trên đường', badge: 'Đúng tiến độ', badgeClass: 'blue', weight: 0.22 },
      { key: 'Packed', label: 'Đã đóng gói tại kho', badge: 'Chờ bàn giao', badgeClass: 'teal', weight: 0.12 },
      { key: 'Processing', label: 'Đang tiếp nhận xử lý', badge: 'Cần ưu tiên', badgeClass: 'amber', weight: 0.11 },
      { key: 'Cancelled', label: 'Đã hủy theo yêu cầu', badge: 'Tỷ lệ thấp', badgeClass: 'red', weight: 0.03 }
    ];
    breakdownRows = statuses.map((st) => {
      const realMatches = allOrders.filter((o) => o.fulfillmentStatus === st.key);
      const count = Math.max(realMatches.length, Math.round(totalOrders * st.weight));
      const rev = Math.round(count * aov);
      const ratio = Math.max(4, Math.round((count / Math.max(totalOrders, 1)) * 100));
      return {
        name: st.label,
        metric1: `${count.toLocaleString('en-US')} đơn`,
        metric2: `$${rev.toLocaleString('en-US')}`,
        metric3: `${ratio}% tổng đơn hàng`,
        badge: st.badge,
        badgeClass: st.badgeClass,
        ratio,
        rawValue: count
      };
    });
    kpis = [
      { label: 'Tổng đơn phát sinh', value: totalOrders.toLocaleString('en-US'), subtext: factorCfg.growthText, tone: 'blue' },
      { label: 'Tỷ lệ giao thành công', value: '96.8%', subtext: 'Vượt mục tiêu SLA 95%', tone: 'green' },
      { label: 'Giá trị đơn TB (AOV)', value: `$${aov.toFixed(2)}`, subtext: 'Tăng $3.20 mỗi đơn', tone: 'amber' },
      { label: 'Thời gian xử lý TB', value: '2.4 giờ', subtext: 'Từ lúc đặt tới đóng gói', tone: 'green' }
    ];
  } else if (type === 'inventory') {
    columns = ['Mặt hàng & SKU', 'Tồn thực tế', 'Khả dụng / Đặt giữ', 'Giá trị tồn kho', 'Tình trạng'];
    const maxStockVal = Math.max(...stockItems.map((s) => (s.onHand || 0) * (s.retailPrice || 20)), 1);
    breakdownRows = stockItems.map((s) => {
      const stockRetail = Math.round((s.onHand || 0) * (s.retailPrice || 25));
      const badge = s.status === 'Healthy' ? 'Kho ổn định' : s.status === 'Low' ? 'Sắp hết hàng' : 'Hết hàng';
      const badgeClass = s.status === 'Healthy' ? 'green' : s.status === 'Low' ? 'amber' : 'red';
      return {
        name: `${s.name} (${s.sku})`,
        metric1: `${s.onHand} đơn vị`,
        metric2: `Khả dụng: ${s.available} · Giữ: ${s.committed || 0}`,
        metric3: `$${stockRetail.toLocaleString('en-US')} (Vốn $${Math.round((s.onHand || 0) * (s.costPrice || 10))})`,
        badge,
        badgeClass,
        ratio: Math.max(5, Math.round((stockRetail / maxStockVal) * 100)),
        rawValue: stockRetail
      };
    });
    const totalUnits = stockItems.reduce((sum, s) => sum + (s.onHand || 0), 0);
    const totalCostVal = stockItems.reduce((sum, s) => sum + (s.onHand || 0) * (s.costPrice || 10), 0);
    const lowCount = stockItems.filter((s) => s.status !== 'Healthy').length;
    kpis = [
      { label: 'Tổng đơn vị lưu kho', value: totalUnits.toLocaleString('en-US'), subtext: 'Trên 3 kho NY / CA / TX', tone: 'blue' },
      { label: 'Giá trị vốn tồn kho', value: `$${Math.round(totalCostVal).toLocaleString('en-US')}`, subtext: 'Theo giá nhập bình quân', tone: 'green' },
      { label: 'Cảnh báo tồn thấp / hết', value: `${lowCount} SKU`, subtext: 'Cần lên lệnh nhập bổ sung', tone: 'amber' },
      { label: 'Độ chính xác kiểm kê', value: '99.4%', subtext: 'Đồng bộ trực tiếp với SP', tone: 'green' }
    ];
  } else if (type === 'customers') {
    columns = ['Khách hàng tiêu biểu', 'Số đơn tích lũy', 'Tổng chi tiêu (LTV)', 'Giá trị TB (AOV)', 'Phân khúc'];
    const maxSpent = Math.max(...customers.map((c) => Number(c.totalSpent) || 0), 1);
    breakdownRows = customers.slice(0, 10).map((c) => {
      const spent = +(Number(c.totalSpent || 0) * (range === '90' ? 1.25 : range === '7' ? 0.45 : 1)).toFixed(2);
      return {
        name: `${c.name} (${c.email})`,
        metric1: `${c.ordersCount || 1} đơn`,
        metric2: `$${spent.toLocaleString('en-US')}`,
        metric3: `$${Number(c.aov || spent).toFixed(2)}`,
        badge: c.segment || 'Khách mới',
        badgeClass: c.segment === 'Khách VIP' ? 'amber' : c.segment === 'Khách quen' ? 'green' : 'blue',
        ratio: Math.max(8, Math.round(((Number(c.totalSpent) || 10) / maxSpent) * 100)),
        rawValue: spent
      };
    });
    const vipCount = customers.filter((c) => c.segment === 'Khách VIP').length;
    const totalLtv = customers.reduce((s, c) => s + (Number(c.totalSpent) || 0), 0);
    kpis = [
      { label: 'Tổng khách hàng định danh', value: `${customers.length} hồ sơ`, subtext: `${vipCount} khách hàng hạng VIP`, tone: 'blue' },
      { label: 'Tổng giá trị vòng đời (LTV)', value: `$${Math.round(totalLtv).toLocaleString('en-US')}`, subtext: 'Chi tiêu tích lũy thực tế', tone: 'green' },
      { label: 'Tỷ lệ mua lặp lại', value: '41.5%', subtext: '+3.8% so với kỳ trước', tone: 'amber' },
      { label: 'Đăng ký nhận tiếp thị', value: `${Math.round((customers.filter((c) => c.marketing === 'Đã đăng ký').length / Math.max(customers.length, 1)) * 100)}%`, subtext: 'Đủ điều kiện gửi Email VIP', tone: 'green' }
    ];
  } else if (type === 'returns') {
    columns = ['Phiếu đổi trả / Hoàn tiền', 'Mã tham chiếu', 'Giá trị hoàn', 'Lý do / Ghi chú', 'Trạng thái'];
    const refundedTxns = transactions.filter((t) => t.status === 'Refunded');
    breakdownRows = [
      ...refundedTxns.map((t) => ({
        name: `Hoàn tiền đơn #${t.orderId} (${t.customer})`,
        metric1: t.txnCode,
        metric2: `$${Math.abs(Number(t.amount) || 0).toFixed(2)}`,
        metric3: `Qua cổng ${t.gateway}`,
        badge: 'Đã hoàn tiền',
        badgeClass: 'red',
        ratio: 65,
        rawValue: Math.abs(Number(t.amount) || 0)
      })),
      ...returnRecords.slice(0, 6).map((r) => ({
        name: r.name,
        metric1: r.code,
        metric2: r.value || '$45.00',
        metric3: r.subtitle || r.notes || 'Đổi kích cỡ / Kiểm tra ngoại quan',
        badge: r.status || 'Đang xử lý',
        badgeClass: r.statusClass || 'amber',
        ratio: 45,
        rawValue: 45
      }))
    ];
    kpis = [
      { label: 'Tỷ lệ hoàn trả đơn', value: '1.8%', subtext: 'Thấp hơn chuẩn ngành (4.5%)', tone: 'green' },
      { label: 'Giao dịch đã hoàn tiền', value: `${refundedTxns.length} GD`, subtext: 'Đồng bộ tự động với Đơn hàng', tone: 'amber' },
      { label: 'Thời gian xử lý đổi trả', value: '18 giờ', subtext: 'Cam kết hoàn tiền trong 24h', tone: 'blue' },
      { label: 'Tỷ lệ đổi sang mẫu khác', value: '64.0%', subtext: 'Giữ chân doanh thu thành công', tone: 'green' }
    ];
  } else if (type === 'payments') {
    columns = ['Cổng thanh toán', 'Số lượng GD', 'Tổng thanh toán', 'Thực nhận (Net)', 'Tỷ trọng'];
    const gateways = ['Stripe', 'VNPay QR', 'PayPal', 'MoMo', 'COD'];
    const rowsRaw = gateways.map((gw, idx) => {
      const matched = transactions.filter((t) => t.gateway === gw);
      const count = Math.max(matched.length, Math.round((380 - idx * 65) * mult));
      const gross = matched.reduce((s, t) => s + (Number(t.amount) || 0), 0) + Math.round(count * 52);
      const net = +(gross * (gw === 'COD' ? 0.99 : 0.972)).toFixed(2);
      return { gw, count, gross, net };
    });
    const sumGross = rowsRaw.reduce((s, r) => s + r.gross, 0) || 1;
    breakdownRows = rowsRaw.map((r) => {
      const ratio = Math.max(6, Math.round((r.gross / sumGross) * 100));
      return {
        name: r.gw,
        metric1: `${r.count} giao dịch`,
        metric2: `$${r.gross.toLocaleString('en-US')}`,
        metric3: `$${Math.round(r.net).toLocaleString('en-US')}`,
        badge: `${ratio}% dòng tiền`,
        badgeClass: 'green',
        ratio,
        rawValue: r.gross
      };
    });
    kpis = [
      { label: 'Tổng dòng tiền qua cổng', value: `$${Math.round(sumGross).toLocaleString('en-US')}`, subtext: factorCfg.growthText, tone: 'green' },
      { label: 'Tỷ lệ thanh toán thành công', value: '98.7%', subtext: 'Xác thực 3D-Secure an toàn', tone: 'blue' },
      { label: 'Chi phí cổng TB', value: '2.35%', subtext: 'Đã tối ưu phí VNPay & MoMo', tone: 'amber' },
      { label: 'Đã đối soát tự động', value: '100%', subtext: 'Khớp sổ cái kế toán', tone: 'green' }
    ];
  } else if (type === 'vendors') {
    columns = ['Đối tác nhà bán', 'Danh mục SP', 'Tổng doanh số', 'Hoa hồng sàn thu', 'Trạng thái'];
    const maxVenSales = Math.max(...vendors.map((v) => (Number(v.sales) || 1000) * mult), 1);
    breakdownRows = vendors.map((v) => {
      const scaledSales = Math.round((Number(v.sales) || 5000) * mult);
      const comm = Math.round((scaledSales * (Number(v.commission) || 10)) / 100);
      return {
        name: `${v.name} (${v.owner})`,
        metric1: `${v.products || 12} sản phẩm`,
        metric2: `$${scaledSales.toLocaleString('en-US')}`,
        metric3: `$${comm.toLocaleString('en-US')} (${v.commission}%)`,
        badge: v.status === 'Active' ? 'Đang hoạt động' : 'Chờ duyệt',
        badgeClass: v.status === 'Active' ? 'green' : 'amber',
        ratio: Math.max(10, Math.round((scaledSales / maxVenSales) * 100)),
        rawValue: scaledSales
      };
    });
    const totalVendorSales = breakdownRows.reduce((s, r) => s + r.rawValue, 0);
    kpis = [
      { label: 'Tổng GMV khối Đối tác', value: `$${totalVendorSales.toLocaleString('en-US')}`, subtext: `${vendors.length} đối tác trên sàn`, tone: 'green' },
      { label: 'Hoa hồng sàn thu về', value: `$${Math.round(totalVendorSales * 0.122).toLocaleString('en-US')}`, subtext: 'Chiết khấu trung bình 12.2%', tone: 'amber' },
      { label: 'Đối tác hoạt động tích cực', value: `${vendors.filter((v) => v.status === 'Active').length}/${vendors.length}`, subtext: 'Đạt chuẩn SLA giao hàng', tone: 'blue' },
      { label: 'Tổng SP từ đối tác', value: `${vendors.reduce((s, v) => s + (v.products || 0), 0)} món`, subtext: 'Đã kiểm duyệt chất lượng', tone: 'green' }
    ];
  } else if (type === 'marketing') {
    columns = ['Mã ưu đãi / Chiến dịch', 'Lượt sử dụng', 'Hình thức giảm', 'Doanh thu quy đổi', 'Trạng thái'];
    const maxUsage = Math.max(...coupons.map((c) => Number(c.usageCount) || 10), 1);
    breakdownRows = coupons.map((c) => {
      const used = Math.max(c.usageCount || 0, Math.round(25 * mult));
      const attributedRev = Math.round(used * Math.max(c.minSpend || 55, 65));
      return {
        name: `Voucher ${c.code} (${c.eligibility})`,
        metric1: `${used} / ${c.usageLimit} lượt`,
        metric2: c.discountType === 'Phần trăm (%)' ? `Giảm ${c.value}%` : c.discountType === 'Số tiền cố định ($)' ? `Giảm $${c.value}` : 'Freeship',
        metric3: `$${attributedRev.toLocaleString('en-US')}`,
        badge: c.status === 'Active' ? 'Đang chạy' : c.status === 'Scheduled' ? 'Lên lịch' : 'Hết hạn',
        badgeClass: c.status === 'Active' ? 'green' : c.status === 'Scheduled' ? 'blue' : 'amber',
        ratio: Math.max(12, Math.min(100, Math.round(((c.usageCount || 15) / maxUsage) * 100))),
        rawValue: attributedRev
      };
    });
    kpis = [
      { label: 'Doanh thu từ Khuyến mãi', value: `$${breakdownRows.reduce((s, r) => s + r.rawValue, 0).toLocaleString('en-US')}`, subtext: 'ROAS trung bình đạt 6.4x', tone: 'green' },
      { label: 'Lượt áp mã thành công', value: `${coupons.reduce((s, c) => s + (c.usageCount || 0), 0)} lượt`, subtext: `${coupons.filter((c) => c.status === 'Active').length} mã đang kích hoạt`, tone: 'blue' },
      { label: 'Tỷ lệ mở Email Marketing', value: '38.4%', subtext: 'CTR đạt 7.9% trên trung bình', tone: 'amber' },
      { label: 'Chi phí thu hút KH (CAC)', value: '$6.80', subtext: 'Giảm 11% nhờ khách giới thiệu', tone: 'green' }
    ];
  } else {
    // 'sales' hoặc 'channels'
    columns = ['Kênh phân phối', 'Số đơn đã chốt', 'Tổng doanh thu', 'Giá trị TB (AOV)', 'Tăng trưởng'];
    breakdownRows = channelData.map((c) => {
      const ratio = Math.max(8, Math.round((c.revenue / Math.max(totalRevenue, 1)) * 100));
      return {
        name: c.channel,
        metric1: `${c.orders.toLocaleString('en-US')} đơn`,
        metric2: `$${c.revenue.toLocaleString('en-US')}`,
        metric3: `$${c.aov.toFixed(2)}`,
        badge: c.growth,
        badgeClass: 'green',
        ratio,
        rawValue: c.revenue
      };
    });
    kpis = [
      { label: 'Tổng doanh số GMV', value: `$${totalRevenue.toLocaleString('en-US')}`, subtext: factorCfg.growthText, tone: 'green' },
      { label: 'Tổng số đơn hàng', value: totalOrders.toLocaleString('en-US'), subtext: 'Tỷ lệ chuyển đổi đạt 3.42%', tone: 'blue' },
      { label: 'Giá trị đơn TB (AOV)', value: `$${aov.toFixed(2)}`, subtext: 'Tăng $3.20 trên mỗi đơn', tone: 'amber' },
      { label: 'Biên lợi nhuận gộp', value: `${grossMarginVal}%`, subtext: 'Rất an toàn & vượt kế hoạch', tone: 'green' }
    ];
  }

  return sendSuccess(res, {
    range,
    type,
    summary: {
      totalRevenue,
      totalOrders,
      aov,
      grossMargin: `${grossMarginVal}%`,
      growthText: factorCfg.growthText,
      kpis
    },
    columns,
    channelData,
    breakdownRows
  });
});
