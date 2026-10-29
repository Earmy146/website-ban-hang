export const initialOrders = [
  {
    id: 'SF83291',
    customer: {
      name: 'Sarah Kim',
      email: 'sarah.kim@example.com',
      avatar: 'SK'
    },
    date: '30 Thg 4, 2026',
    channel: 'Cửa hàng trực tuyến',
    itemsCount: 3,
    itemsDesc: 'Áo thun Everyday Tee + 2 sản phẩm khác',
    total: 95.72,
    paymentStatus: 'Paid', // Paid, Pending, Refunded
    fulfillmentStatus: 'Processing', // Processing, Shipped, Delivered, Packed
    shippingMethod: 'Giao hàng tiêu chuẩn',
    address: 'Quận 1, TP. Hồ Chí Minh'
  },
  {
    id: 'SF83290',
    customer: {
      name: 'Michael Tân',
      email: 'michael.tan@example.com',
      avatar: 'MT'
    },
    date: '27 Thg 4, 2026',
    channel: 'Cửa hàng trực tuyến',
    itemsCount: 1,
    itemsDesc: 'Balo tối giản Minimal Backpack',
    total: 85.32,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Shipped',
    shippingMethod: 'Giao hỏa tốc DHL',
    address: 'Quận 3, TP. Hồ Chí Minh'
  },
  {
    id: 'SF83289',
    customer: {
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      avatar: 'ED'
    },
    date: '24 Thg 4, 2026',
    channel: 'Ứng dụng di động',
    itemsCount: 2,
    itemsDesc: 'Ly sứ Ceramic Mug (x2)',
    total: 43.88,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Delivered',
    shippingMethod: 'Giao hàng tiêu chuẩn',
    address: 'Ba Đình, Hà Nội'
  },
  {
    id: 'SF83288',
    customer: {
      name: 'Daniel Lê',
      email: 'daniel.lee@example.com',
      avatar: 'DL'
    },
    date: '21 Thg 4, 2026',
    channel: 'Sàn thương mại',
    itemsCount: 3,
    itemsDesc: 'Túi vải Canvas Tote Bag + Phụ kiện',
    total: 74.12,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Packed',
    shippingMethod: 'Giao tiết kiệm Viettel Post',
    address: 'Hải Châu, Đà Nẵng'
  },
  {
    id: 'SF83287',
    customer: {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      avatar: 'PS'
    },
    date: '18 Thg 4, 2026',
    channel: 'Cửa hàng trực tuyến',
    itemsCount: 1,
    itemsDesc: 'Bình nước giữ nhiệt Water Bottle',
    total: 32.50,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Delivered',
    shippingMethod: 'Giao hàng tiêu chuẩn',
    address: 'Ninh Kiều, Cần Thơ'
  },
  {
    id: 'SF83286',
    customer: {
      name: 'Alex Trần',
      email: 'alex.tran@example.com',
      avatar: 'AT'
    },
    date: '15 Thg 4, 2026',
    channel: 'Ứng dụng di động',
    itemsCount: 4,
    itemsDesc: 'Áo khoác Linen + Bộ sổ tay',
    total: 120.00,
    paymentStatus: 'Pending',
    fulfillmentStatus: 'Processing',
    shippingMethod: 'Giao hỏa tốc 2H',
    address: 'Cầu Giấy, Hà Nội'
  },
  {
    id: 'SF83285',
    customer: {
      name: 'Trần Vĩ (Chen Wei)',
      email: 'chen.wei@example.com',
      avatar: 'CW'
    },
    date: '12 Thg 4, 2026',
    channel: 'Sàn thương mại',
    itemsCount: 2,
    itemsDesc: 'Chuột không dây Wireless Mouse',
    total: 51.20,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Shipped',
    shippingMethod: 'Giao hàng nhanh GHTK',
    address: 'Bình Thạnh, TP. Hồ Chí Minh'
  },
  {
    id: 'SF83284',
    customer: {
      name: 'Olivia Martin',
      email: 'olivia.martin@example.com',
      avatar: 'OM'
    },
    date: '09 Thg 4, 2026',
    channel: 'Cửa hàng trực tuyến',
    itemsCount: 1,
    itemsDesc: 'Khăn choàng Cotton Throw',
    total: 61.90,
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Delivered',
    shippingMethod: 'Giao hàng tiêu chuẩn',
    address: 'Ngô Quyền, Hải Phòng'
  }
];
