import fs from 'fs';

const nav = JSON.parse(fs.readFileSync('src/data/navigation.json', 'utf8'));

const translations = {
  // Groups
  "Operate": "Vận hành",
  "Commerce": "Kinh doanh",
  "Grow & connect": "Tăng trưởng & Kết nối",
  "Workspace": "Hệ thống & Cài đặt",

  // Items Level 1
  "Overview": "Tổng quan",
  "Products": "Sản phẩm",
  "Orders": "Đơn hàng",
  "Inventory": "Kho & Tồn kho",
  "Customers": "Khách hàng",
  "Checkout & pricing": "Thanh toán & Bảng giá",
  "Marketplace": "Sàn thương mại",
  "Online store": "Cửa hàng trực tuyến",
  "Payments": "Cổng thanh toán",
  "Reports": "Báo cáo thống kê",
  "Communication": "Hộp thư & CSKH",
  "Veylix AI": "Trợ lý AI",
  "Media & files": "Tệp tin & Đa phương tiện",
  "Team & access": "Nhân sự & Phân quyền",
  "Integrations": "Tích hợp & API",
  "Settings": "Cài đặt hệ thống",

  // Sub-items
  "Variants & options": "Biến thể & Tùy chọn",
  "Categories": "Danh mục sản phẩm",
  "Attributes": "Thuộc tính sản phẩm",
  "Brands": "Thương hiệu",
  "Collections": "Bộ sưu tập",
  "Tags": "Thẻ sản phẩm",
  "Reviews & ratings": "Đánh giá & Xếp hạng",

  "Fulfillment & tracking": "Vận đơn & Đóng gói",
  "Delivery & shipment tracking": "Theo dõi vận chuyển",
  "Carriers & service levels": "Đơn vị vận chuyển",
  "Returns": "Yêu cầu trả hàng",
  "Refund requests": "Yêu cầu hoàn tiền",
  "Cancellations": "Đơn hàng đã hủy",
  "Abandoned checkouts": "Giỏ hàng bỏ quên",

  "Stock & availability": "Tồn kho & Khả dụng",
  "Warehouses": "Quản lý kho hàng",
  "Stock transfers": "Chuyển kho nội bộ",
  "Replenishment": "Kế hoạch nhập hàng",
  "Adjustments & audit": "Kiểm kê & Điều chỉnh",
  "Suppliers": "Nhà cung cấp",

  "Customer segments": "Phân khúc khách hàng",

  "Checkout experience": "Quy trình thanh toán",
  "Checkout payment methods": "Phương thức thanh toán",
  "Coupons": "Mã giảm giá",
  "Automatic discounts": "Giảm giá tự động",
  "Promotions": "Chương trình khuyến mãi",
  "Gift cards": "Thẻ quà tặng",
  "Campaigns": "Chiến dịch bán hàng",

  "Marketplace overview": "Tổng quan sàn TMĐT",
  "Vendors": "Danh sách người bán",
  "Vendor applications": "Hồ sơ đăng ký bán hàng",
  "Product approvals": "Phê duyệt sản phẩm",
  "Vendor orders": "Đơn hàng đối tác",
  "Commission rules": "Quy định hoa hồng",
  "Vendor payouts": "Thanh toán đối tác",
  "Marketplace disputes": "Khiếu nại & Tranh chấp",
  "Marketplace policy": "Chính sách sàn",

  "Menus & mega menus": "Menu điều hướng",
  "Store pages": "Trang nội dung",
  "Blog posts": "Bài viết blog",
  "Testimonials": "Cảm nhận khách hàng",
  "Contact messages": "Tin nhắn liên hệ",
  "Popups & announcements": "Popup & Thông báo",
  "FAQ library": "Thư viện hỏi đáp",

  "Transactions": "Lịch sử giao dịch",
  "Payment providers": "Nhà cung cấp thanh toán",
  "Settlements": "Quyết toán tài chính",
  "Payment links": "Link thanh toán nhanh",

  "Sales report": "Báo cáo doanh số",
  "Orders report": "Báo cáo đơn hàng",
  "Products report": "Báo cáo sản phẩm",
  "Inventory report": "Báo cáo tồn kho",
  "Customers report": "Báo cáo khách hàng",
  "Returns report": "Báo cáo trả hàng",
  "Channels report": "Báo cáo kênh bán hàng",
  "Payments report": "Báo cáo thanh toán",
  "Vendors report": "Báo cáo người bán",
  "Marketing report": "Báo cáo tiếp thị",

  "Customer inbox": "Hộp thư khách hàng",
  "Support tickets": "Phiếu yêu cầu hỗ trợ",
  "Email workspace": "Không gian gửi email",
  "Message templates": "Mẫu tin nhắn",
  "Notifications & activity": "Thông báo & Hoạt động",

  "AI workflows": "Quy trình AI tự động",
  "Commerce AI studio": "AI Studio thương mại",
  "Voice & product assist": "Trợ lý giọng nói & sản phẩm",
  "AI knowledge": "Cơ sở tri thức AI",
  "Prompt library": "Thư viện câu lệnh (Prompts)",
  "AI reply rules": "Quy tắc phản hồi tự động",
  "AI activity & usage": "Lịch sử & Mức dùng AI",

  "Media library": "Thư viện ảnh & video",
  "File manager": "Quản lý tệp tin",

  "Team members": "Thành viên nhóm",
  "Roles": "Vai trò người dùng",
  "Permission matrix": "Ma trận phân quyền",
  "Teams": "Đội nhóm",
  "Activity log": "Nhật ký hoạt động",

  "API connections": "Kết nối API",
  "Webhooks": "Cấu hình Webhooks",

  "General settings": "Cài đặt chung",
  "Branding": "Thương hiệu & Logo",
  "Language & currency": "Ngôn ngữ & Tiền tệ",
  "Store SEO": "Tối ưu SEO cửa hàng",
  "Maintenance mode": "Chế độ bảo trì",
  "Marketing connections": "Kết nối tiếp thị",
  "Tax rules": "Quy định thuế",
  "Shipping zones & rates": "Vùng vận chuyển & Phí ship",
  "Notification preferences": "Cài đặt thông báo",
  "Email delivery": "Cấu hình gửi email",
  "Storage settings": "Lưu trữ dữ liệu",
  "Security": "Bảo mật tài khoản"
};

for (const group of nav) {
  if (translations[group.groupTitle]) {
    group.groupTitle = translations[group.groupTitle];
  }
  for (const item of group.items) {
    if (translations[item.title]) {
      item.title = translations[item.title];
    }
    if (item.children) {
      for (const child of item.children) {
        if (translations[child.title]) {
          child.title = translations[child.title];
        }
      }
    }
  }
}

fs.writeFileSync('src/data/navigation.json', JSON.stringify(nav, null, 2), 'utf8');
console.log('Navigation successfully translated to Vietnamese!');
