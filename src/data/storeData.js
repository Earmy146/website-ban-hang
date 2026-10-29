export const PERIODS = [
  { id: '7', label: '7 ngày qua', range: '24 – 30 Tháng 4, 2026', sales: '$18,460', orders: 342, conversion: '3.5%', aov: '$54.00', change: '+8.4%' },
  { id: '30', label: '30 ngày qua', range: '1 – 30 Tháng 4, 2026', sales: '$124,592', orders: 1248, conversion: '3.42%', aov: '$99.80', change: '+12.6%' },
  { id: '90', label: '90 ngày qua', range: '1 Tháng 2 – 30 Tháng 4, 2026', sales: '$368,240', orders: 3820, conversion: '3.38%', aov: '$96.40', change: '+15.2%' },
  { id: '365', label: 'Từ đầu năm', range: '1 Tháng 1 – 30 Tháng 4, 2026', sales: '$512,800', orders: 5190, conversion: '3.40%', aov: '$98.80', change: '+18.1%' }
];

export const LANGUAGES = [
  { id: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { id: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { id: 'ar', name: 'العربية', flag: '🇦🇪' }
];

export const NOTIFICATIONS = [
  { id: 'notif-1', title: 'Cảnh báo sắp hết hàng', detail: 'Chuột không dây Wireless Mouse chỉ còn 8 chiếc tại Kho Tây.', time: '10 phút trước', unread: true, type: 'warning' },
  { id: 'notif-2', title: 'Đơn hàng mới #VX83291', detail: 'Khách hàng Sarah Kim vừa đặt mua 2 sản phẩm ($79.00).', time: '25 phút trước', unread: true, type: 'order' },
  { id: 'notif-3', title: 'Vận đơn chậm trễ', detail: 'Kiện hàng #TRK-9821 qua FedEx bị hoãn do thời tiết xấu.', time: '1 giờ trước', unread: true, type: 'danger' },
  { id: 'notif-4', title: 'Đánh giá 5 sao mới', detail: 'Balo tối giản Minimal Backpack vừa nhận được đánh giá xuất sắc.', time: '2 giờ trước', unread: false, type: 'review' },
  { id: 'notif-5', title: 'Lịch quyết toán đối tác', detail: 'Khoản quyết toán tuần này trị giá $3,420 đã sẵn sàng duyệt.', time: '4 giờ trước', unread: false, type: 'finance' }
];

export const CURRENT_USER = {
  name: 'Alex Chen',
  role: 'Quản trị viên cửa hàng',
  email: 'alex.chen@veylix.vn',
  avatarLetter: 'A'
};

export const QUICK_SEARCH_ITEMS = [
  { type: 'order', id: 'VX83291', title: '#VX83291 · Sarah Kim', subtitle: 'Đơn hàng · 2 sản phẩm · $79.00', path: '/commerce/orders' },
  { type: 'order', id: 'VX83290', title: '#VX83290 · Michael Tan', subtitle: 'Đơn hàng · 1 sản phẩm · $24.00', path: '/commerce/orders' },
  { type: 'order', id: 'VX83289', title: '#VX83289 · Emily Davis', subtitle: 'Đơn hàng · 3 sản phẩm · $129.00', path: '/commerce/orders' },
  { type: 'order', id: 'VX83288', title: '#VX83288 · Daniel Lee', subtitle: 'Đơn hàng · 1 sản phẩm · $49.00', path: '/commerce/orders' },
  { type: 'product', id: 'everyday-tee', title: 'Áo thun hàng ngày (Everyday Tee)', subtitle: 'Sản phẩm · $24.00', path: '/commerce/products' },
  { type: 'product', id: 'minimal-backpack', title: 'Balo tối giản (Minimal Backpack)', subtitle: 'Sản phẩm · $79.00', path: '/commerce/products' },
  { type: 'product', id: 'ceramic-mug', title: 'Ly sứ cao cấp (Ceramic Mug)', subtitle: 'Sản phẩm · $18.00', path: '/commerce/products' },
  { type: 'product', id: 'canvas-tote', title: 'Túi vải Canvas (Tote Bag)', subtitle: 'Sắp hết hàng · Còn 12 chiếc', path: '/commerce/stock' },
  { type: 'product', id: 'wireless-mouse', title: 'Chuột không dây (Wireless Mouse)', subtitle: 'Sắp hết hàng · Còn 8 chiếc', path: '/commerce/stock' }
];
