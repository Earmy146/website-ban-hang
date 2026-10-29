# Veylix - Ecommerce Operations Dashboard (React + Vite)

Dự án tái dựng giao diện bảng điều khiển vận hành thương mại điện tử **Veylix** từ dữ liệu dynamic capture, chuyển đổi sang kiến trúc hiện đại bằng **React 19**, **Vite** và **React Router v7**.

---

## 🌟 Các tính năng đã được tái dựng hoàn chỉnh

1. **Kiến trúc App Shell chuẩn Veylix**:
   - **Sidebar**:
     - Menu đa tầng với 4 phân hệ lớn: *Operate*, *Commerce*, *Grow & connect*, *Workspace*.
     - Hơn 20 danh mục và 60+ trang con (Overview, Products, Variants, Categories, Brands, Orders, Fulfillment, Deliveries, Stock, Warehouses, Customers, Segments, Checkout, Marketplace, Reports, AI Workspace, Settings...).
     - Hỗ trợ đóng/mở submenu mượt mà và nút thu gọn Sidebar (`.collapsed`) với chuẩn kích thước 76px.
     - Responsive mobile menu với lớp phủ scrim mờ (`.sidebar-scrim`).
   - **Topbar**:
     - Bộ đếm chỉ số nhanh: *Orders (1,248)*, *Low stock (8)*, *Delayed (3)*.
     - Bộ lọc thời gian: *Dashboard Period* (Last 7 days, Last 30 days, Last 90 days, Year to date).
     - Đổi ngôn ngữ: Cờ và tên ngôn ngữ (English, Tiếng Việt, Deutsch, Français, Svenska, العربية).
     - Trung tâm thông báo: Chuông thông báo với chấm đỏ Unread, danh sách thông báo và nút *Mark all as read*.
     - Menu người dùng: Avatar, tên tài khoản *Alex Chen (Store Owner)*.
     - **Command Palette (`Ctrl + K` / `Cmd + K`)**: Tìm kiếm nhanh đơn hàng, sản phẩm, và điều hướng đến mọi trang trong hệ thống.
   - **Main Content Shell**:
     - Render linh hoạt 60 trang giao diện, tự động bắt link nội bộ để điều hướng SPA mượt mà không reload trang.
     - Tự động vẽ biểu đồ trực quan (Canvas 2D Mini Sales Bar & Revenue Trend Gradient Curves) trên trang Overview.

2. **Design System & Assets**:
   - Toàn bộ 326KB CSS gốc của Veylix: Glassmorphism, animations, theme color `#eee7da`, typography chuẩn font `Manrope`.
   - Đầy đủ thư viện SVG icon vector, ảnh sản phẩm, banner WebP và bản đồ thế giới SVG.

---

## 🚀 Hướng dẫn khởi chạy

### 1. Cài đặt dependencies (đã cài sẵn)
```bash
npm install
```

### 2. Chạy Dev Server
```bash
npm run dev
```
Trình duyệt sẽ mở tại `http://localhost:3000` (hoặc cổng hiển thị trong terminal).

### 3. Build ứng dụng cho Production
```bash
npm run build
```
Thư mục `dist/` sẽ được tạo ra với tốc độ build cực nhanh (< 300ms).

### 4. Xem trước bản build Production
```bash
npm run preview
```

---

## 📁 Cấu trúc thư mục

```
veylix-clone/
├── index.html                   # HTML gốc hỗ trợ SPA
├── vite.config.js               # Cấu hình Vite & Alias @
├── package.json                 # React 19, Vite 8, React Router 7
├── public/
│   └── assets/
│       ├── images/              # Toàn bộ logo, icons, ảnh sản phẩm PNG, banner WebP, map SVG
│       └── manrope-*.woff2      # Font chữ gốc Manrope
├── src/
│   ├── main.jsx                 # Điểm khởi chạy ứng dụng React
│   ├── App.jsx                  # Thiết lập AppShell & Route switch
│   ├── styles/
│   │   └── veylix.css           # Toàn bộ CSS Design System gốc (326KB)
│   ├── data/
│   │   ├── navigation.json      # Cấu trúc 4 nhóm menu, icons và 60 routes
│   │   ├── pages-content.json   # Dữ liệu HTML chi tiết của 60 pages
│   │   └── storeData.js         # Mock data cho Period, Languages, Notifications, User, Quick Search
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx     # Shell bọc Sidebar, Topbar và Main content
│   │   │   ├── Sidebar.jsx      # Navigation sidebar đa tầng co giãn
│   │   │   └── Topbar.jsx       # Header bar với Metrics, Tools & Search trigger
│   │   └── ui/
│   │       ├── SearchModal.jsx  # Command Palette tìm kiếm toàn diện (Ctrl + K)
│   │       └── HeaderPopovers.jsx # Popovers cho Period, Lang, Notif, Profile
│   └── pages/
│       └── PageRenderer.jsx     # Component render thông minh 60 trang kèm biểu đồ Canvas
└── scripts/                     # Các tool bóc tách dữ liệu và kiểm thử
```

---

## 🔌 Sẵn sàng tích hợp Backend sau này

Hệ thống đã chuẩn bị sẵn file `src/data/storeData.js`. Khi bạn bắt đầu xây dựng backend:
1. Tạo một thư mục `src/services/api.js`.
2. Tạo các endpoint tương ứng:
   - `GET /api/overview/metrics`
   - `GET /api/products`
   - `GET /api/orders`
   - `GET /api/notifications`
3. Thay thế dữ liệu mock trong `storeData.js` bằng lời gọi API thật. Toàn bộ giao diện frontend giữ nguyên 100%.

