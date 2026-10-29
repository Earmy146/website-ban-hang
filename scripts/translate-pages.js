import fs from 'fs';

const pages = JSON.parse(fs.readFileSync('src/data/pages-content.json', 'utf8'));

// Bộ từ điển thay thế các chuỗi giao diện sang Tiếng Việt
const dict = [
  // Titles
  { from: /Overview \| Veylix/g, to: 'Tổng quan | Veylix' },
  { from: /Products \| Veylix/g, to: 'Sản phẩm | Veylix' },
  { from: /Variants & options \| Veylix/g, to: 'Biến thể & Tùy chọn | Veylix' },
  { from: /Categories \| Veylix/g, to: 'Danh mục sản phẩm | Veylix' },
  { from: /Attributes \| Veylix/g, to: 'Thuộc tính sản phẩm | Veylix' },
  { from: /Brands \| Veylix/g, to: 'Thương hiệu | Veylix' },
  { from: /Collections \| Veylix/g, to: 'Bộ sưu tập | Veylix' },
  { from: /Tags \| Veylix/g, to: 'Thẻ sản phẩm | Veylix' },
  { from: /Reviews & ratings \| Veylix/g, to: 'Đánh giá & Xếp hạng | Veylix' },
  { from: /Orders \| Veylix/g, to: 'Đơn hàng | Veylix' },
  { from: /Fulfillment & tracking \| Veylix/g, to: 'Vận đơn & Đóng gói | Veylix' },
  { from: /Delivery & shipment tracking \| Veylix/g, to: 'Theo dõi giao hàng | Veylix' },
  { from: /Carriers & service levels \| Veylix/g, to: 'Đơn vị vận chuyển | Veylix' },
  { from: /Returns \| Veylix/g, to: 'Yêu cầu trả hàng | Veylix' },
  { from: /Refund requests \| Veylix/g, to: 'Yêu cầu hoàn tiền | Veylix' },
  { from: /Cancellations \| Veylix/g, to: 'Đơn hàng đã hủy | Veylix' },
  { from: /Abandoned checkouts \| Veylix/g, to: 'Giỏ hàng bỏ quên | Veylix' },
  { from: /Stock & availability \| Veylix/g, to: 'Tồn kho & Khả dụng | Veylix' },
  { from: /Warehouses \| Veylix/g, to: 'Kho hàng | Veylix' },
  { from: /Stock transfers \| Veylix/g, to: 'Chuyển kho | Veylix' },
  { from: /Replenishment \| Veylix/g, to: 'Kế hoạch nhập hàng | Veylix' },
  { from: /Adjustments & audit \| Veylix/g, to: 'Kiểm kê & Điều chỉnh | Veylix' },
  { from: /Suppliers \| Veylix/g, to: 'Nhà cung cấp | Veylix' },
  { from: /Customers \| Veylix/g, to: 'Khách hàng | Veylix' },
  { from: /Customer segments \| Veylix/g, to: 'Phân khúc khách hàng | Veylix' },

  // Overview metrics & labels
  { from: /Total Sales <span>\(GMV\)<\/span>/g, to: 'Tổng doanh số <span>(GMV)</span>' },
  { from: /Total Sales/g, to: 'Tổng doanh số' },
  { from: /vs previous period/g, to: 'so với kỳ trước' },
  { from: /<span>Avg\. order value<\/span>/g, to: '<span>Giá trị TB/đơn</span>' },
  { from: /<span>Conversion<\/span>/g, to: '<span>Tỷ lệ chuyển đổi</span>' },
  { from: />Revenue Trend</g, to: '>Xu hướng doanh thu<' },
  { from: /This period/g, to: 'Kỳ này' },
  { from: /Last period/g, to: 'Kỳ trước' },
  { from: /Morning, Alex\. Your store in motion\./g, to: 'Chào buổi sáng, Alex. Cửa hàng đang vận hành suôn sẻ.' },
  { from: /Orders received/g, to: 'Đơn hàng đã nhận' },
  { from: />Live Shipments</g, to: '>Vận đơn trực tiếp<' },
  { from: />View all</g, to: '>Xem tất cả<' },
  { from: />Processing</g, to: '>Đang xử lý<' },
  { from: />Packed</g, to: '>Đã đóng gói<' },
  { from: />Shipped</g, to: '>Đã xuất kho<' },
  { from: />Delivered</g, to: '>Đã giao hàng<' },
  { from: />Out for delivery</g, to: '>Đang giao hàng<' },
  { from: />In transit</g, to: '>Đang vận chuyển<' },
  { from: />Label created</g, to: '>Đã tạo vận đơn<' },
  { from: />Delayed</g, to: '>Giao chậm<' },
  { from: />Sales Channels</g, to: '>Kênh bán hàng<' },
  { from: />Top Buying Regions</g, to: '>Khu vực mua sắm hàng đầu<' },
  { from: />Recent Deliveries</g, to: '>Giao hàng gần đây<' },
  { from: />Recent Sales</g, to: '>Doanh số gần đây<' },
  { from: />Quick Actions</g, to: '>Thao tác nhanh<' },
  { from: />Add Product</g, to: '>Thêm sản phẩm<' },
  { from: />View Reports</g, to: '>Xem báo cáo<' },
  { from: />AI Assistant</g, to: '>Trợ lý AI<' },
  { from: />Store overview</g, to: '>Tổng quan cửa hàng<' },
  { from: />All systems operational</g, to: '>Tất cả hệ thống hoạt động tốt<' },
  { from: />Store pulse and greeting</g, to: '>Tình trạng hoạt động cửa hàng<' },
  { from: />Search workspace</g, to: '>Tìm kiếm không gian làm việc<' },
  { from: />No new notifications</g, to: '>Không có thông báo mới<' },
  { from: /unread notifications/g, to: 'thông báo chưa đọc' },
  { from: />Export report</g, to: '>Xuất báo cáo<' },
  { from: />Filter</g, to: '>Bộ lọc<' },
  { from: />Search products</g, to: '>Tìm kiếm sản phẩm<' },
  { from: />Search orders</g, to: '>Tìm kiếm đơn hàng<' },
  { from: />Search customers</g, to: '>Tìm kiếm khách hàng<' },
  { from: />Previous page</g, to: '>Trang trước<' },
  { from: />Next page</g, to: '>Trang sau<' },
  { from: /units remaining/g, to: 'sản phẩm còn lại' }
];

let translatedPagesCount = 0;

for (const [key, page] of Object.entries(pages)) {
  let content = page.mainHtml;
  let title = page.title;

  for (const item of dict) {
    content = content.replace(item.from, item.to);
    title = title.replace(item.from, item.to);
  }

  page.mainHtml = content;
  page.title = title;
  translatedPagesCount++;
}

fs.writeFileSync('src/data/pages-content.json', JSON.stringify(pages, null, 2), 'utf8');
console.log(`Successfully translated ${translatedPagesCount} pages in pages-content.json!`);
