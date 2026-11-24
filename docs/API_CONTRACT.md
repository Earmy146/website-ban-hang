# Hợp đồng API & Thiết kế Cơ sở dữ liệu Thống nhất — Veylix Ecommerce Dashboard

Tài liệu này là **Hợp đồng API chính thức (Single Source of Truth)** dùng chung cho tất cả các thành viên trong Swarm (`@database`, `@backend`, `@frontend`, `@verifier`).
**Quy tắc bắt buộc**: Mọi đề xuất thay đổi tên trường, kiểu dữ liệu, đường dẫn endpoint hoặc mã trạng thái PHẢI được trao đổi trên Swarm Board trước khi sửa code.

---

## 1. Quyền sở hữu File (File Ownership — Tuyệt đối không ghi đè của nhau)

Workspace chung: `C:\code\veylix-clone`

| Thành viên | Phạm vi sở hữu được phép tạo / sửa | Cấm sửa |
| :--- | :--- | :--- |
| **Coordinator** | `docs/API_CONTRACT.md` | Toàn bộ code `src/` và `backend/` |
| **`@database`** | `backend/src/config/db.js`, `backend/src/models/**`, `backend/src/seeds/**` | `backend/package.json`, `backend/src/routes/**`, `backend/src/controllers/**`, `backend/src/app.js`, `backend/src/server.js`, `src/**` |
| **`@backend`** | `backend/package.json`, `backend/package-lock.json`, `backend/.env`, `backend/.env.example`, `backend/.gitignore`, `backend/src/app.js`, `backend/src/server.js`, `backend/src/middleware/**`, `backend/src/controllers/**`, `backend/src/routes/**`, `backend/src/utils/**` | `backend/src/config/db.js`, `backend/src/models/**`, `backend/src/seeds/**`, `src/**` |
| **`@frontend`** | `src/**` (mã nguồn Frontend hiện có), `vite.config.js` (thêm proxy `/api`), `.env.example` (ở root cho FE) | Toàn bộ `backend/**`, không xóa tính năng hoặc viết lại thiết kế giao diện đang có |
| **`@verifier`** | `scripts/verify-integration.mjs` (nếu cần viết script kiểm thử tích hợp) | Không sửa code của `@database`, `@backend`, `@frontend`; phát hiện lỗi phải trả về đúng worker trên board |

> **Lưu ý phối hợp package**: `@backend` cài đặt dependencies trong `backend/package.json` (`express`, `mongoose`, `cors`, `dotenv`, `mongodb-memory-server`) với `"type": "module"` và khai báo script `"seed": "node src/seeds/seed.js"`, `"start": "node src/server.js"`, `"dev": "node --watch src/server.js"`. Không dùng dữ liệu hoặc thông tin đăng nhập production.

---

## 2. Quy ước Chung về API, Biến môi trường & Định dạng Dữ liệu

### 2.1. Cổng chạy & Kết nối
- **Backend Server**: Mặc định `PORT=5000`, prefix tất cả API là `/api` (`http://localhost:5000/api/...`).
- **Frontend Vite Server**: Mặc định `port: 3000`. Cấu hình `vite.config.js` proxy `/api` -> `http://localhost:5000` (`changeOrigin: true`). Trong `src/services/api.js`, sử dụng `import.meta.env.VITE_API_URL || '/api'`.
- **Kết nối MongoDB (`backend/src/config/db.js`)**:
  - Ưu tiên kết nối `process.env.MONGODB_URI` (mặc định `mongodb://127.0.0.1:27017/veylix`) với `serverSelectionTimeoutMS: 2500`.
  - Nếu máy chưa bật `mongod` local và `process.env.ALLOW_MEMORY_DB !== 'false'`, tự động khởi chạy `MongoMemoryServer` (`mongodb-memory-server`), kết nối Mongoose vào đó và tự động chạy hàm seed khởi tạo nếu DB đang trống (`seedIfEmpty()`).
  - Export rõ ràng từ `backend/src/config/db.js`: `connectDB()`, `disconnectDB()`, `getDbStatus()` (trả về `{ connected: boolean, mode: 'mongodb' | 'memory', uri: string }`).

### 2.2. Định dạng JSON Response chuẩn
- **Thành công (`200 OK` / `201 Created`)**:
  ```json
  {
    "success": true,
    "data": {},
    "meta": {}
  }
  ```
- **Lỗi (`400` Validation / `404` Not Found / `409` Conflict / `500` Server Error)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Thông báo lỗi tiếng Việt rõ ràng",
      "details": []
    }
  }
  ```

### 2.3. Quy ước trường `id` khi trả JSON từ Mongoose (`toJSON` transform)
- Mặc định mọi model đều bật `toJSON: { virtuals: true }` và chuẩn hóa trường `id` (string), xóa `__v`:
  - **Ngoại lệ bắt buộc cho 3 model hiển thị mã nghiệp vụ trực tiếp làm `id` trên UI**:
    1. **`Order`**: Lưu mã đơn trong trường `orderCode` (VD: `"SF83291"`). Khi `toJSON()`, gán `ret.id = ret.orderCode` (giữ `ret._id` là ObjectId). API nhận `:id` chấp nhận cả `orderCode` (không có `#`) lẫn `_id`.
    2. **`Shipment`**: Lưu mã vận đơn trong trường `trackingCode` (VD: `"TRK-98214"`). Khi `toJSON()`, gán `ret.id = ret.trackingCode` và `ret.createdAt = ret.createdAtLabel || ret.createdAt` (để hiển thị chuỗi tiếng Việt như `"Hôm nay, 08:30"`). API nhận `:id` chấp nhận cả `trackingCode` lẫn `_id`.
    3. **`Transaction`**: Lưu mã giao dịch trong trường `txnCode` (VD: `"TXN-90214"`). Khi `toJSON()`, gán `ret.id = ret.txnCode`. API nhận `:id` chấp nhận cả `txnCode` lẫn `_id`.
  - **Tất cả các model còn lại**: `ret.id = ret._id.toString()`.

---

## 3. Bảng Thống nhất Tính năng: Màn hình FE → Endpoint → Request/Response → MongoDB

| # | Màn hình FE & Route | Endpoint API | Request (Query / Body) | Response `data` chính | Collection & Các trường MongoDB |
| :- | :--- | :--- | :--- | :--- | :--- |
| **0** | **Health Check** | `GET /api/health` | — | `{ status: 'ok', db: { connected, mode }, timestamp }` | Kiểm tra kết nối Express + Mongoose |
| **1** | **AppShell & Topbar**<br>(Toàn cục) | `GET /api/topbar/summary`<br>`GET /api/notifications`<br>`PATCH /api/notifications/:id/read`<br>`PATCH /api/notifications/read-all`<br>`GET /api/search?q=...` | `q`: từ khóa tìm nhanh (`Ctrl+K`) | - `summary`: `{ ordersCount, lowStockCount, delayedCount, currentUser, periods }`<br>- `notifications`: `[{ id, title, detail, time, unread, type }]`<br>- `search`: `[{ type: 'order'\|'product'\|'customer', id, title, subtitle, path }]` | **`notifications`**: `title`, `detail`, `time`, `unread` (Boolean, index), `type` (`warning`\|`order`\|`danger`\|`review`\|`finance`\|`info`).<br>Tổng hợp từ `orders`, `stock_items`, `shipments`, `store_settings`. |
| **2** | **Tổng quan**<br>`/overview`<br>(`OverviewPage.jsx`) | `GET /api/overview?period=30&chartRange=30` | `period`: `7`\|`30`\|`90`\|`365`<br>`chartRange`: `7`\|`30` | `{ gmvCard: { gmv, delta, conversionRate, aov, bars: number[] }, revenueChart: { points: [{ label, val1, val2 }] }, operations: { totalOrders, steps: [{ label, count, color, total }] }, liveShipments: [{ id, orderId, status, statusClass, time, dest }], salesChannels: [{ name, percent, revenue, color, icon }], recentOrders: [Order] }` | Tổng hợp động từ **`orders`**, **`shipments`**, **`transactions`**, **`stock_items`**, **`products`**. Khi bấm nút "Làm mới" trên `OverviewHeading`, gọi lại API này. |
| **3** | **Sản phẩm**<br>`/commerce/products`<br>(`ProductsPage.jsx`) | `GET /api/products`<br>`POST /api/products`<br>`PUT /api/products/:id`<br>`DELETE /api/products/:id`<br>`POST /api/products/:id/duplicate`<br>`POST /api/products/bulk-archive`<br>`POST /api/products/import` | - Query GET: `search`, `category`, `status`, `includeDeleted=true\|false`<br>- POST: `{ name*, category, sku, price*, inventory, desc, brand, image }`<br>- PUT: `{ name, price, inventory, status, category, brand, desc }`<br>- Bulk: `{ ids: string[] }`<br>- Import: `{ products: [...] }` | Mảng hoặc đối tượng `Product`:<br>`{ id, name, sku, category, brand, status, inventory, maxInventory, sales, revenue, trend, trendUp, rating, date, image, price, desc, isDeleted }` | **`products`**:<br>`name`*, `sku`* (unique), `category`*, `categoryRef` (ObjectId->`Category`), `brand`, `brandRef` (ObjectId->`Brand`), `status` (`Active`\|`Low stock`\|`Out of stock`\|`Draft`), `inventory`, `maxInventory`, `sales`, `revenue`, `trend`, `trendUp`, `rating`, `date`, `image`, `price`*, `desc`, `isDeleted` (Boolean, default `false` — phục vụ bộ lọc "Sản phẩm đã xóa").<br>*Nghiệp vụ*: Thêm/sửa tồn kho SP đồng bộ với `stock_items` cùng `sku`. |
| **4** | **Danh mục SP**<br>`/commerce/categories`<br>(`CategoriesPage.jsx`) | `GET /api/categories`<br>`POST /api/categories`<br>`PUT /api/categories/:id`<br>`DELETE /api/categories/:id` | - Query GET: `search`<br>- POST/PUT: `{ name*, slug, icon, status, sortOrder }` | `{ id, name, slug, count, icon, status, sortOrder }` | **`categories`**:<br>`name`* (unique), `slug`* (unique, index), `icon`, `count` (Number), `status` (`Active`\|`Hidden`), `sortOrder` (Number, index). |
| **5** | **Thương hiệu**<br>`/commerce/brands`<br>(`BrandsPage.jsx`) | `GET /api/brands`<br>`POST /api/brands`<br>`PUT /api/brands/:id`<br>`DELETE /api/brands/:id` | - Query GET: `search`<br>- POST/PUT: `{ name*, origin, status }` | `{ id, name, origin, productsCount, revenue, status }` | **`brands`**:<br>`name`* (unique), `origin`, `productsCount`, `revenue`, `status` (`Active`\|`Inactive`). |
| **6** | **Đơn hàng**<br>`/commerce/orders`<br>(`OrdersPage.jsx`) | `GET /api/orders`<br>`GET /api/orders/:id`<br>`POST /api/orders`<br>`PATCH /api/orders/:id/status`<br>`DELETE /api/orders/:id`<br>`POST /api/orders/bulk-cancel` | - Query GET: `channel`, `paymentStatus`, `fulfillmentStatus`, `search`<br>- POST: `{ customerName*, customerEmail, channel, itemsDesc, itemsCount, total*, paymentStatus, fulfillmentStatus, shippingMethod, address }`<br>- PATCH status: `{ paymentStatus, fulfillmentStatus }`<br>- Bulk cancel: `{ ids: string[] }` | `{ id (orderCode, VD: "SF83291"), customer: { name, email, avatar }, date, channel, itemsCount, itemsDesc, total, paymentStatus, fulfillmentStatus, shippingMethod, address }` | **`orders`**:<br>`orderCode`* (unique, VD `SF83291`), `customerRef` (ObjectId->`Customer`), `customer: { name*, email, avatar }`, `date`, `channel`, `itemsCount`, `itemsDesc`, `total`*, `paymentStatus` (`Paid`\|`Pending`\|`Refunded`), `fulfillmentStatus` (`Processing`\|`Packed`\|`Shipped`\|`Delivered`\|`Cancelled`), `shippingMethod`, `address`.<br>*Nghiệp vụ*: Tạo đơn mới tự sinh `orderCode`, cập nhật thống kê khách hàng nếu trùng email, tạo `Transaction` tương ứng. |
| **7** | **Vận đơn & Giao nhận**<br>`/commerce/fulfillment`<br>(`FulfillmentPage.jsx`) | `GET /api/shipments`<br>`POST /api/shipments`<br>`PATCH /api/shipments/:id/advance` | - Query GET: `carrier`, `status`, `search`<br>- POST: `{ orderId*, carrier*, customer, destination* }`<br>- PATCH advance: không cần body (tự chuyển `Pending -> Packaging -> Out for delivery -> Delivered`) | `{ id (trackingCode, VD: "TRK-98214"), orderId, carrier, customer, destination, status, statusText, statusClass, createdAt, eta }` | **`shipments`**:<br>`trackingCode`* (unique), `orderId`*, `orderRef` (ObjectId->`Order`), `carrier`*, `customer`*, `destination`*, `status` (`Pending`\|`Packaging`\|`Out for delivery`\|`Delivered`\|`Delayed`), `statusText`, `statusClass` (`purple`\|`amber`\|`teal`\|`blue`\|`green`\|`red`), `createdAtLabel`, `eta`.<br>*Nghiệp vụ*: Chuyển trạng thái vận đơn đồng bộ `fulfillmentStatus` cho `Order` liên kết. Nếu POST thiếu `customer`, tự tra từ `Order` theo `orderId` hoặc dùng `'Khách nhận hàng'`. |
| **8** | **Tồn kho & Khả dụng**<br>`/commerce/stock`<br>(`StockPage.jsx`) | `GET /api/stock`<br>`POST /api/stock/transfer`<br>`POST /api/stock/receive`<br>`PATCH /api/stock/:id/adjust` | - Query GET: `status`, `category`, `search`<br>- POST transfer: `{ sku*, fromLoc*, toLoc*, quantity* }` (`NY`\|`CA`\|`TX`)<br>- POST receive: `{ sku*, targetLoc*, quantity* }`<br>- PATCH adjust: `{ onHand*, reorderPoint* }` | `{ id, name, category, brand, sku, onHand, committed, incoming, available, reorderPoint, locationNY, locationCA, locationTX, status, costPrice, retailPrice }` | **`stock_items`**:<br>`productRef` (ObjectId->`Product`), `name`*, `category`*, `brand`, `sku`* (unique), `onHand`, `committed`, `incoming`, `available`, `reorderPoint`, `locationNY`, `locationCA`, `locationTX`, `status` (`Healthy`\|`Low`\|`Out`), `costPrice`, `retailPrice`.<br>*Nghiệp vụ*: Kiểm tra `fromLoc !== toLoc` và kho xuất đủ số lượng khi chuyển kho; tự tính `available = Math.max(0, onHand - committed)` và `status`, đồng bộ `Product.inventory`. |
| **9** | **Khách hàng**<br>`/commerce/customers`<br>(`CustomersPage.jsx`) | `GET /api/customers`<br>`POST /api/customers`<br>`PUT /api/customers/:id`<br>`DELETE /api/customers/:id`<br>`POST /api/customers/bulk-delete` | - Query GET: `segment`, `marketing`, `search`<br>- POST/PUT: `{ name*, email*, phone, location, segment, marketing }`<br>- Bulk delete: `{ ids: string[] }` | `{ id, name, email, phone, avatar, segment, ordersCount, totalSpent, aov, lastOrder, location, marketing, status }` | **`customers`**:<br>`name`*, `email`* (unique, lowercase), `phone`, `avatar`, `segment` (`Khách VIP`\|`Khách quen`\|`Khách mới`), `ordersCount`, `totalSpent`, `aov`, `lastOrder`, `location`, `marketing` (`Đã đăng ký`\|`Chưa đăng ký`), `status` (`Active`\|`Inactive`). |
| **10** | **Phân khúc KH**<br>`/commerce/segments`<br>(`SegmentsPage.jsx`) | `GET /api/segments`<br>`POST /api/segments`<br>`DELETE /api/segments/:id` | - POST: `{ name*, criteria, color }` | `{ id, name, count, criteria, aov, color }` | **`segments`**:<br>`name`* (unique), `count`, `criteria`, `aov`, `color`. |
| **11** | **Mã giảm giá**<br>`/commerce/coupons`<br>(`CouponsPage.jsx`) | `GET /api/coupons`<br>`POST /api/coupons`<br>`PUT /api/coupons/:id`<br>`DELETE /api/coupons/:id`<br>`POST /api/coupons/bulk-delete` | - Query GET: `discountType`, `status`, `search`<br>- POST: `{ code*, discountType, value, minSpend, eligibility, usageLimit, startDate, endDate }`<br>- PUT: `{ value, usageLimit, minSpend, status }`<br>- Bulk delete: `{ ids: string[] }` | `{ id, code, discountType, value, minSpend, eligibility, status, usageCount, usageLimit, startDate, endDate }` | **`coupons`**:<br>`code`* (unique, uppercase), `discountType` (`Phần trăm (%)`\|`Số tiền cố định ($)`\|`Miễn phí vận chuyển`), `value`, `minSpend`, `eligibility`, `status` (`Active`\|`Scheduled`\|`Expired`), `usageCount`, `usageLimit`, `startDate`, `endDate`. |
| **12** | **Đánh giá & Xếp hạng**<br>`/commerce/reviews`<br>(`ReviewsPage.jsx`) | `GET /api/reviews`<br>`PATCH /api/reviews/:id/status`<br>`PATCH /api/reviews/:id/reply` | - Query GET: `rating`, `status`, `search`<br>- PATCH status: `{ status: 'Published' \| 'Pending' \| 'Flagged' }`<br>- PATCH reply: `{ response* }` | `{ id, productName, customerName, rating, title, comment, date, status, sentiment, verified, response }` | **`reviews`**:<br>`productRef` (ObjectId->`Product`), `customerRef` (ObjectId->`Customer`), `productName`*, `customerName`*, `rating`* (1..5), `title`*, `comment`*, `date`, `status` (`Published`\|`Pending`\|`Flagged`), `sentiment` (`Positive`\|`Neutral`\|`Negative`), `verified`, `response`. |
| **13** | **Giao dịch & Dòng tiền**<br>`/commerce/transactions`<br>(`TransactionsPage.jsx`) | `GET /api/transactions`<br>`POST /api/transactions/:id/refund` | - Query GET: `gateway`, `status`, `search`<br>- POST refund: không cần body | `{ id (txnCode, VD: "TXN-90214"), orderId, customer, gateway, amount, fee, net, status, statusText, statusClass, date, cardLast4 }` | **`transactions`**:<br>`txnCode`* (unique), `orderId`*, `orderRef` (ObjectId->`Order`), `customer`*, `gateway`*, `amount`*, `fee`, `net`, `status` (`Succeeded`\|`Pending`\|`Refunded`), `statusText`, `statusClass`, `date`, `cardLast4`.<br>*Nghiệp vụ*: Hoàn tiền cập nhật `status='Refunded'`, `statusText='Đã hoàn tiền'`, `statusClass='red'`, `net=-amount`, đồng bộ `Order.paymentStatus='Refunded'`. |
| **14** | **Báo cáo thống kê**<br>`/commerce/reports` & `/commerce/report-sales`<br>(`ReportsPage.jsx`) | `GET /api/reports?range=30` | `range`: `7`\|`30`\|`90` | `{ range, summary: { totalRevenue, totalOrders, aov, grossMargin, growthText }, channelData: [{ channel, orders, revenue, aov, growth }] }` | Tổng hợp động theo kỳ (`7`, `30`, `90` ngày) từ **`orders`** và **`transactions`**. |
| **15** | **Sàn TMĐT & Đối tác**<br>`/commerce/marketplace`<br>(`MarketplacePage.jsx`) | `GET /api/vendors`<br>`POST /api/vendors`<br>`POST /api/vendors/:id/payout` | - POST: `{ name*, owner, commission }`<br>- POST payout: quyết toán số dư chờ (`pendingPayout -> 0`) | `{ id, name, owner, commission, sales, pendingPayout, status, products }` | **`vendors`**:<br>`name`*, `owner`, `commission` (0..100), `sales`, `pendingPayout`, `status` (`Active`\|`Pending`\|`Suspended`), `products`. |
| **16** | **Hộp thư CSKH**<br>`/commerce/chat`<br>(`ChatPage.jsx`) | `GET /api/conversations`<br>`PATCH /api/conversations/:id/read`<br>`POST /api/conversations/:id/messages` | - POST message: `{ text*, sender: 'shop' }` | `{ id, customer, avatar, lastMessage, time, unread, messages: [{ sender, text, time }] }` | **`conversations`**:<br>`customerRef` (ObjectId->`Customer`), `customer`*, `avatar`, `lastMessage`, `time`, `unread` (Boolean), `messages: [{ sender, text, time }]`. |
| **17** | **Quy trình AI**<br>`/commerce/ai-workflows`<br>(`AiWorkflowsPage.jsx`) | `GET /api/ai-workflows`<br>`POST /api/ai-workflows`<br>`PATCH /api/ai-workflows/:id/toggle`<br>`POST /api/ai-workflows/:id/run` | - POST: `{ name*, description, trigger }` | `{ id, name, description, trigger, status, runsCount, lastRun }` | **`ai_workflows`**:<br>`name`*, `description`, `trigger`*, `status` (`Active`\|`Paused`), `runsCount`, `lastRun`. (`POST .../run` tăng `runsCount + 1`, cập nhật `lastRun = 'Vừa xong'`). |
| **18** | **Thành viên nhóm**<br>`/commerce/users`<br>(`UsersPage.jsx`) | `GET /api/users`<br>`POST /api/users`<br>`PUT /api/users/:id`<br>`DELETE /api/users/:id` | - POST: `{ name*, email*, role }`<br>- PUT: `{ role* }` | `{ id, name, email, role, status, avatar, lastActive }` | **`team_members`**:<br>`name`*, `email`* (unique), `role`*, `status` (`Active`\|`Invited`), `avatar`, `lastActive`. Không cho phép xóa thành viên có vai trò `'Chủ sở hữu (Owner)'`. |
| **19** | **Cài đặt chung**<br>`/commerce/settings-general`<br>(`GeneralSettingsPage.jsx`) | `GET /api/settings`<br>`PUT /api/settings` | - PUT: `{ storeName*, tagline, supportEmail*, supportPhone, currency, timezone, language, taxRate, address, city, country, allowGuestCheckout, autoFulfill }` | Đối tượng cấu hình `StoreSetting` | **`store_settings`**:<br>`key` (`'general'`, unique), đầy đủ các trường cài đặt cửa hàng + `currentUser`. |
| **20** | **45+ Trang nghiệp vụ con**<br>`/commerce/*`<br>(`GeneralCommercePage.jsx`) | `GET /api/modules/:slug`<br>`POST /api/modules/:slug`<br>`DELETE /api/modules/:slug/:id` | - Query GET: `search`, `title` (tên tiếng Việt của phân hệ để tự khởi tạo bản ghi mẫu nếu phân hệ chưa có dữ liệu)<br>- POST: `{ name*, status, count, value }` | `[{ id, moduleSlug, name, code, date, status, statusClass, count, value }]` | **`module_records`**:<br>`moduleSlug`* (index), `name`*, `code`*, `date`, `status`, `statusClass`, `count`, `value`. |

---

## 4. Lưu ý Sửa lỗi Dữ liệu & Tương thích Giao diện FE
1. **Ảnh sản phẩm trong `public/assets/images/products/`**:
   Danh sách 12 file ảnh thật đang có trong repo:
   `everyday-tee.png`, `minimal-backpack.png`, `ceramic-mug.png`, `canvas-tote-bag.png`, `wireless-mouse.png`, `water-bottle.png`, `notebook-set.png`, `linen-overshirt.png`, `cotton-throw.png`, `travel-pouch.png`, `desk-organizer.png`, `stoneware-bowl.png`.
   `@database` (trong dữ liệu seed) và `@frontend` (trong fallback nếu có) dùng đúng tên 12 file trên (thay cho 4 đường dẫn lỗi 404 cũ: `canvas-tote.png` -> `canvas-tote-bag.png`, `leather-passport.png` -> `travel-pouch.png`, `desk-tray.png` -> `desk-organizer.png`, `card-holder.png` -> `stoneware-bowl.png`).
2. **Tuyến đường Báo cáo trên Sidebar**:
   Trong `navigation.json`, mục đầu tiên của Báo cáo thống kê trỏ tới `/commerce/report-sales`, trong khi `App.jsx` mới gắn `/commerce/reports` cho `<ReportsPage />`. `@frontend` giữ nguyên `/commerce/reports` và bổ sung route `/commerce/report-sales` cùng trỏ về `<ReportsPage />`.
3. **Đồng bộ chuyển trang trên `GeneralCommercePage.jsx`**:
   Khi `location.pathname` thay đổi giữa các route con (`/commerce/variants`, `/commerce/warehouses`, ...), `@frontend` dùng `useEffect` theo `slug` để gọi `GET /api/modules/:slug?title=...`, đảm bảo dữ liệu cập nhật đúng phân hệ và lưu bền vững vào MongoDB.
4. **Bộ lọc "Sản phẩm đã xóa" (`showDeleted`) trên `ProductsPage.jsx`**:
   Kết nối tham số `?includeDeleted=true` (hoặc lọc theo trường `isDeleted`) để khi bật ô kiểm "Sản phẩm đã xóa" trên `ProductToolbar`, danh sách hiển thị đúng các sản phẩm đã lưu trữ/xóa mềm.


---

# PHỤ LỤC HỢP ĐỒNG API V2 — Sửa lỗi Tương tác Admin, Làm sâu 45+ Phân hệ & Xây dựng Giao diện Người dùng (Storefront)

## 5. Phân quyền Sở hữu File V2 (Tuyệt đối không chồng lấn)

| Thành viên | Phạm vi sở hữu ĐỘC QUYỀN được phép tạo / sửa | Cấm sửa |
| :--- | :--- | :--- |
| **`@database`** | `backend/src/config/db.js`, `backend/src/models/**`, `backend/src/seeds/**` | Mọi file ngoài danh sách trên |
| **`@backend`** | `backend/package.json`, `backend/src/app.js`, `backend/src/server.js`, `backend/src/middleware/**`, `backend/src/controllers/**`, `backend/src/routes/**`, `backend/src/utils/**` | `backend/src/config/db.js`, `backend/src/models/**`, `backend/src/seeds/**`, `src/**` |
| **`@frontend`** | `package.json` (root), `scripts/dev-all.mjs`, `src/App.jsx`, `src/services/api.js`, `src/styles/custom.css`, `src/components/layout/**`, `src/components/ui/**`, `src/components/overview/**`, `src/components/commerce/**`, `src/pages/overview/**`, `src/pages/commerce/**` (17 trang Admin chính) | `src/pages/common/**`, `src/pages/storefront/**`, `src/components/storefront/**`, `src/styles/storefront.css`, `backend/**` |
| **`@admin-modules`** | `src/pages/common/**` (`GeneralCommercePage.jsx` và tất cả các view chuyên sâu con bên trong `src/pages/common/`) | Mọi file ngoài `src/pages/common/**` (gọi API qua `request()` hoặc `api` từ `src/services/api.js`) |
| **`@storefront`** | `src/pages/storefront/**` (bắt buộc export default `StorefrontApp` tại `src/pages/storefront/StorefrontApp.jsx`), `src/components/storefront/**`, `src/styles/storefront.css` | Mọi file ngoài 3 đường dẫn trên (gọi API qua `request()` từ `src/services/api.js`) |
| **`@verifier`** | `scripts/verify-integration.mjs` | Không sửa bất kỳ file nào của các worker khác |

---

## 6. Nâng cấp Database & Seed V2 (`@database`)

1. **Model mới `backend/src/models/ModuleConfig.js` (export `ModuleConfig` trong `models/index.js`)**:
   - Collection: `module_configs`
   - Các trường: `slug` (String, required, unique, index), `title` (String), `group` (String), `settings` (mongoose.Schema.Types.Mixed, default `{}`), `updatedBy` (String, default `'Alex Chen'`), timestamps.
   - Phục vụ lưu trữ bền vững cấu hình Form / Toggle / Ma trận phân quyền cho tất cả các trang Cài đặt con (`settings-branding`, `settings-localization`, `settings-seo`, `settings-maintenance`, `settings-marketing`, `settings-notifications`, `settings-email`, `settings-storage`, `settings-security`, `taxes`, `shipping-rules`, `checkout`, `methods`, `commissions`, `settings-marketplace`, `roles`, `permissions`, `store`).
2. **Mở rộng `ModuleRecord.js`**:
   - Bổ sung các trường tùy chọn (giữ tương thích ngược 100%): `subtitle` (String, default `''`), `category` (String, default `''`), `owner` (String, default `''`), `notes` (String, default `''`), `meta` (Mixed, default `{}`).
3. **Mở rộng `AiWorkflow.js`**:
   - Bổ sung trường `logs` (`[{ time: String, summary: String, output: String }]`, default `[]`) lưu kết quả các lần chạy thử.
4. **Nâng cấp toàn diện `backend/src/seeds/seedData.js`**:
   - Thay thế dữ liệu chung chung kiểu `"Tên phân hệ #01"` trong `module_records` bằng dữ liệu tiếng Việt thực tế, sống động theo đúng ngữ cảnh từng phân hệ (VD: `warehouses` có Kho trung tâm TP.HCM, Kho miền Bắc Hà Nội, Kho miền Trung Đà Nẵng; `carriers` có GHTK, GHN, Viettel Post, DHL Express; `variants` có các biến thể kích cỡ/màu sắc của sản phẩm Veylix; `tickets` có các phiếu CSKH thực tế; `blog` có bài viết thương hiệu; `faqs` có câu hỏi mua sắm/đổi trả dùng chung cho cả Storefront; `gift-cards`, `promotions`, `suppliers`, `returns`, `refunds`, `audit`...).
   - Seed dữ liệu khởi tạo cho `ModuleConfig` (bao gồm cấu hình `store` cho Storefront Hero/Announcement Bar, `settings-maintenance` với `enabled: false`, `settings-seo`, `taxes`, `shipping-rules`, và ma trận `permissions` cho 5 vai trò).

---

## 7. Bảng Hợp đồng API V2 Mở rộng (`@backend`, `@frontend`, `@admin-modules`, `@storefront`)

### 7.1. API Mở rộng cho Admin & 45+ Phân hệ Chuyên sâu
| Màn hình / Tính năng | Endpoint mới / nâng cấp | Request Body / Query | Response `data` |
| :--- | :--- | :--- | :--- |
| **Chỉnh sửa & Hàng loạt Phân hệ con** | `PUT /api/modules/:slug/:id`<br>`POST /api/modules/:slug/bulk-delete`<br>`POST /api/modules/:slug/bulk-status` | - PUT: `{ name, code, status, statusClass, count, value, subtitle, category, owner, notes, meta }`<br>- Bulk: `{ ids: string[], status?, statusClass? }` | Bản ghi cập nhật hoặc `{ updatedCount / deletedCount }` |
| **Cấu hình Chuyên sâu & Phân quyền** | `GET /api/module-configs/:slug`<br>`PUT /api/module-configs/:slug` | - PUT: `{ title?, settings: Object }` (tự upsert nếu chưa có) | `{ id, slug, title, settings, updatedAt }` — khi cập nhật ghi thêm 1 dòng vào `module_records` (`moduleSlug: 'audit'`) |
| **Phân khúc KH đầy đủ** | `PUT /api/segments/:id`<br>`POST /api/segments/:id/send-offer` | - PUT: `{ name, criteria, color }`<br>- Send offer: `{ couponCode, message }` | `Segment` cập nhật / `{ sentCount, couponCode }` |
| **Thao tác Hàng loạt Kho & KH** | `POST /api/stock/bulk-transfer`<br>`POST /api/customers/bulk-email` | - Bulk transfer: `{ skus: string[], fromLoc, toLoc, quantity }`<br>- Bulk email: `{ ids: string[], subject*, content* }` | Danh sách `StockItem` mới / `{ sentCount, recipients }` |
| **Đối tác Sàn TMĐT đầy đủ** | `PUT /api/vendors/:id`<br>`DELETE /api/vendors/:id`<br>`PATCH /api/vendors/:id/status`<br>`GET /api/vendors/:id/report` | - PATCH status: `{ status: 'Active' \| 'Pending' \| 'Suspended' }` | `Vendor` cập nhật / Báo cáo chi tiết `{ vendor, commissionEarned, netSales, recentOrders, productsList }` |
| **AI Workflows & AI Studio** | `PUT /api/ai-workflows/:id`<br>`DELETE /api/ai-workflows/:id`<br>`POST /api/ai/generate` | - Generate: `{ type: 'seo'\|'email'\|'reply'\|'social', prompt*, productName?, tone? }` | Kết quả sinh nội dung tiếng Việt chuyên nghiệp dựa trên sản phẩm thực trong DB + lưu vào `module_records` (`ai-history`) |
| **Hộp thư CSKH mở rộng** | `POST /api/conversations` | `{ customer*, email?, initialMessage* }` | `Conversation` mới tạo |
| **10 Trang Báo cáo Chuyên sâu** | `GET /api/reports?range=30&type=sales` | `type`: `sales`\|`orders`\|`products`\|`inventory`\|`customers`\|`returns`\|`channels`\|`payments`\|`vendors`\|`marketing` | `{ range, type, summary, channelData, breakdownRows: [{ name, metric1, metric2, metric3, badge, ratio }] }` tổng hợp từ dữ liệu thực trong DB |

### 7.2. API Giao diện Cửa hàng phía Người dùng — Customer Storefront (`/api/store/*`)
| Màn hình Storefront | Endpoint | Request | Response `data` & Nghiệp vụ MongoDB |
| :--- | :--- | :--- | :--- |
| **Trang chủ & Khởi tạo Storefront**<br>`/store` | `GET /api/store/home` | — | `{ settings: StoreSetting, storefrontConfig: ModuleConfig('store'), maintenance: ModuleConfig('settings-maintenance'), shippingConfig: ModuleConfig('shipping-rules'), categories: [Category Active], featuredProducts: [Product Active/Low stock], activeCoupons: [Coupon Active], reviews: [Review Published], faqs: [ModuleRecord('faqs')] }` |
| **Danh mục & Chi tiết Sản phẩm**<br>`/store/products`<br>`/store/products/:idOrSku` | `GET /api/store/products`<br>`GET /api/store/products/:idOrSku` | Query: `search`, `category`, `brand`, `minPrice`, `maxPrice`, `inStockOnly`, `sort` (`popular`\|`newest`\|`price_asc`\|`price_desc`\|`rating`) | - Danh sách sản phẩm chưa xóa (`isDeleted: false`)<br>- Chi tiết: `{ product, stock: StockItem, reviews: [Review Published], relatedProducts: [Product] }` |
| **Kiểm tra Mã giảm giá**<br>`/store/checkout` | `POST /api/store/validate-coupon` | `{ code*, subtotal* }` | Kiểm tra `Coupon` (`status === 'Active'`, `usageCount < usageLimit`, `subtotal >= minSpend`). Trả `{ coupon, discountAmount, freeShipping, message }` hoặc HTTP `400` tiếng Việt rõ lý do. |
| **Đặt hàng (Checkout)**<br>`/store/checkout` | `POST /api/store/checkout` | `{ customer: { name*, email*, phone*, address* }, items: [{ productId, sku, name, price, quantity, variant }] *, shippingMethod, paymentMethod, couponCode?, note? }` | **Liên thông 6 collections**:<br>1. Kiểm tra tồn kho & trừ `Product.inventory` + `StockItem` (`onHand`, `available`, cập nhật `status`).<br>2. Tính `subtotal`, `discountAmount` (tăng `Coupon.usageCount`), `shippingFee`, `taxAmount` (`StoreSetting.taxRate`), `total`.<br>3. Tạo `Order` (`orderCode: 'SFxxxxx'`, `channel: 'Cửa hàng trực tuyến'`).<br>4. Tạo `Transaction` (`txnCode: 'TXN-xxxxx'`).<br>5. Tạo `Shipment` (`trackingCode: 'TRK-xxxxx'`, `status: 'Pending'`).<br>6. Upsert `Customer` (tăng `ordersCount`, `totalSpent`, `aov`, `lastOrder`) & tạo `Notification` đơn hàng mới cho Admin!<br>Trả về `{ order, shipment, transaction }`. |
| **Tra cứu & Quản lý Đơn của Khách**<br>`/store/orders` & `/store/account` | `GET /api/store/orders/lookup?orderCode=&email=`<br>`GET /api/store/customers/orders?email=`<br>`POST /api/store/orders/:id/cancel` | - Lookup theo `orderCode` (có hoặc không `#`)<br>- Cancel: chỉ cho phép khi `fulfillmentStatus === 'Processing'`, hoàn lại tồn kho & đổi trạng thái | `{ order, shipment, transaction }` hoặc danh sách đơn hàng của khách |
| **Tài khoản Khách hàng (Mẫu an toàn)**<br>`/store/account` | `POST /api/store/auth/login`<br>`POST /api/store/auth/register` | - Login: `{ email* }` (hoặc chọn nhanh khách hàng mẫu demo)<br>- Register: `{ name*, email*, phone, location }` | Trả thông tin `Customer` từ MongoDB (không dùng mật khẩu/thông tin nhạy cảm production) |
| **Gửi Đánh giá Sản phẩm**<br>`/store/products/:id` | `POST /api/store/reviews` | `{ productId, productName*, customerName*, rating* (1..5), title*, comment* }` | Tạo `Review` (`status: 'Published'`, `verified: true`) + cập nhật điểm `rating` trung bình của `Product` + tạo `Notification` cho Admin |
| **Live Chat Khách hàng ↔ Shop**<br>Widget trên `/store/*` | `GET /api/store/chat?customer=&email=`<br>`POST /api/store/chat` | - POST: `{ customer*, email?, text* }` | Tìm hoặc tạo `Conversation` của khách đó, thêm tin nhắn `{ sender: 'customer', text, time }`, đặt `unread: true` để hiển thị ngay trong `/commerce/chat` của Admin + tạo `Notification`! |


---

# PHỤ LỤC HỢP ĐỒNG V3 (CẬP NHẬT) — Giao diện Người dùng Sang trọng Dễ hiểu (Loại bỏ Neubrutalist) & Kiểm toán Trực quan Toàn bộ Admin

## 8. Bổ sung Nhỏ về API & Dữ liệu V3 (`@backend`)
Giữ nguyên 100% phân quyền sở hữu file ở Mục 5. Bổ sung các hỗ trợ nhỏ sau trên Backend:
1. **`DELETE /api/reviews/:id`**: Xóa đánh giá spam/vi phạm và tính lại `Product.rating` trung bình nếu cần.
2. **`PUT /api/users/:id`**: Chấp nhận cập nhật `{ name?, role?, status? }` (`status`: `'Active' | 'Invited' | 'Disabled'`, chặn khóa hoặc hạ quyền tài khoản `'Chủ sở hữu (Owner)'`).
3. **`POST /api/shipments/bulk-advance`**: `{ ids: string[] }` -> chuyển bước tiến độ giao hàng hàng loạt cho các vận đơn chưa `Delivered` và đồng bộ `Order.fulfillmentStatus`.
4. **`ModuleConfig('store')` trong `GET /api/store/home`**: Sử dụng mặc định sang trọng `defaultUiStyle: 'veylix'` (hoặc `'glass'`), `defaultColorTheme: 'veylix'`, `defaultColorMode: 'light'` (**TUYỆT ĐỐI KHÔNG dùng `neobrutalist`**).

## 9. Chuẩn Thiết kế & Cá nhân hóa Giao diện Người dùng (`/store/*` — `@storefront`)
> **CHỈ ĐẠO QUAN TRỌNG TỪ NGƯỜI DÙNG**: **LOẠI BỎ HOÀN TOÀN `neobrutalist`** (không dùng góc vuông `0px`, không viền đen dày `2px/3px`, không bóng đổ cứng đen).

Scope toàn bộ CSS biến đổi vào container gốc của Storefront (`.sf-root[data-sf-style="..."][data-sf-theme="..."][data-sf-mode="..."]`):
- **Phong cách UI thanh lịch, hiện đại (`data-sf-style`, mặc định `'veylix'`)**:
  1. `veylix` (*🏛️ Veylix Kem Ấm Sang Trọng — Mặc định*): Nền kem ấm áp `#f6f1e7` / `#fffdf9`, bo góc mềm mại `16px–22px`, bóng đổ mịn tự nhiên, tinh tế chuẩn thương hiệu thời trang & lifestyle cao cấp.
  2. `glass` (*✨ Thủy Tinh Mờ Cao Cấp*): Kính mờ `backdrop-filter: blur(18px)` trong trẻo, chiều sâu sang trọng.
  3. `liquid-glass` (*💧 Kính Lỏng Hiện Đại*): Hiệu ứng lăng kính sáng mịn kiểu Apple Spatial.
  4. `flat` (*□ Tối Giản Tinh Khôi*): Phẳng sạch sẽ, thoáng đãng, dễ đọc tối đa.
- **Bảng màu hài hòa (`data-sf-theme`, mặc định `'veylix'`)**: `veylix` (*🏛️ Hổ Phách Kem Ấm*), `xanh-rung` (*🌿 Xanh Rừng Tự Nhiên*), `xanh-duong` (*🌊 Xanh Đại Dương*), `hong` (*🌸 Hồng Tinh Tế*), `tim` (*👑 Tím Thanh Lịch*), `cam` (*🔥 Cam Ấm Áp*).
- **Chế độ màu (`data-sf-mode`)**: `light` | `dark` (đảm bảo độ tương phản chữ êm mắt và sắc nét ở mọi chế độ).
