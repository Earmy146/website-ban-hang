// Danh mục cấu hình nghiệp vụ, schema form, ma trận phân quyền và metadata cho 60+ trang con Admin Veylix

export const STATUS_OPTIONS = [
  { value: 'Hoạt động', className: 'green' },
  { value: 'Đang xử lý', className: 'amber' },
  { value: 'Đã hoàn tất', className: 'blue' },
  { value: 'Tạm dừng', className: 'red' },
  { value: 'Lưu trữ', className: 'purple' },
];

export function resolveStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('hoạt động') || s.includes('active') || s.includes('bật') || s.includes('thành công') || s.includes('đã duyệt')) return 'green';
  if (s.includes('xử lý') || s.includes('chờ') || s.includes('nháp') || s.includes('pending')) return 'amber';
  if (s.includes('hoàn tất') || s.includes('đã giao') || s.includes('đối soát') || s.includes('đã gửi')) return 'blue';
  if (s.includes('hủy') || s.includes('tạm dừng') || s.includes('lỗi') || s.includes('từ chối') || s.includes('trễ')) return 'red';
  return 'purple';
}

// ==========================================
// PHÂN LOẠI NHÓM ROUTE (SMART DOMAIN ROUTER)
// ==========================================
export const CONFIG_SLUGS = new Set([
  'settings-branding',
  'settings-localization',
  'settings-seo',
  'settings-maintenance',
  'settings-marketing',
  'settings-notifications',
  'settings-email',
  'settings-storage',
  'settings-security',
  'taxes',
  'shipping-rules',
  'checkout',
  'methods',
  'commissions',
  'settings-marketplace',
]);

export const ACCESS_SLUGS = new Set(['roles', 'permissions', 'teams', 'audit']);

export const REPORT_SLUGS = new Set([
  'report-orders',
  'report-products',
  'report-inventory',
  'report-customers',
  'report-returns',
  'report-channels',
  'report-payments',
  'report-vendors',
  'report-marketing',
]);

export const AI_SLUGS = new Set([
  'ai-studio',
  'ai-voice',
  'prompts',
  'knowledge',
  'automations',
  'ai-history',
]);

export const MEDIA_SLUGS = new Set(['media', 'files']);
export const INFRA_CARD_SLUGS = new Set([
  'warehouses',
  'carriers',
  'providers',
  'integrations',
  'webhooks',
]);

export function resolveDomainType(slug) {
  if (slug === 'store') return 'storefront-control';
  if (slug === 'notifications') return 'notifications-center';
  if (MEDIA_SLUGS.has(slug)) return 'media-gallery';
  if (INFRA_CARD_SLUGS.has(slug)) return 'infrastructure-cards';
  if (CONFIG_SLUGS.has(slug)) return 'config-form';
  if (ACCESS_SLUGS.has(slug)) return 'access-audit';
  if (REPORT_SLUGS.has(slug)) return 'specialized-report';
  if (AI_SLUGS.has(slug)) return 'ai-workspace';
  return 'resource-list';
}

// ==========================================
// NHÓM 1: 15 SCHEMA FORM CẤU HÌNH CHUYÊN SÂU
// ==========================================
export const CONFIG_SCHEMAS = {
  'settings-branding': {
    subtitle: 'Quản lý nhận diện thương hiệu, bộ màu chủ đạo, kiểu chữ và tài sản hình ảnh trên toàn hệ thống.',
    defaults: {
      brandName: 'Veylix Studio',
      slogan: 'Thương mại trong sự hài hòa',
      logoUrl: '/assets/images/products/minimal-backpack.png',
      faviconUrl: '/favicon.ico',
      primaryColor: '#27342b',
      accentColor: '#b87d14',
      surfaceColor: '#f6f1e7',
      headingFont: 'Manrope',
      borderRadiusStyle: 'Bo tròn mềm mại (16px)',
      invoiceFooterNote: 'Cảm ơn quý khách đã đồng hành cùng Veylix Studio. Đổi trả miễn phí trong 30 ngày.',
      showPoweredBy: false,
      enableWatermark: false,
    },
    sections: [
      {
        title: 'Nhận diện cốt lõi & Logo',
        desc: 'Hiển thị trên thanh điều hướng cửa hàng, email giao dịch và phiếu in vận đơn.',
        fields: [
          { key: 'brandName', label: 'Tên thương hiệu hiển thị *', type: 'text', required: true },
          { key: 'slogan', label: 'Khẩu hiệu thương hiệu (Tagline)', type: 'text' },
          { key: 'logoUrl', label: 'Đường dẫn Logo chính (SVG / PNG)', type: 'text' },
          { key: 'faviconUrl', label: 'Đường dẫn Favicon trình duyệt', type: 'text' },
        ],
      },
      {
        title: 'Bảng màu & Kiểu dáng thiết kế',
        desc: 'Đồng bộ màu sắc nhận diện giữa trang Storefront và chứng từ điện tử.',
        fields: [
          { key: 'primaryColor', label: 'Màu thương hiệu chính', type: 'color' },
          { key: 'accentColor', label: 'Màu nhấn CTA (Vàng hổ phách)', type: 'color' },
          {
            key: 'headingFont',
            label: 'Phông chữ tiêu đề',
            type: 'select',
            options: ['Manrope', 'Inter', 'Plus Jakarta Sans', 'Playfair Display'],
          },
          {
            key: 'borderRadiusStyle',
            label: 'Phong cách góc bo thẻ & nút',
            type: 'select',
            options: ['Vuông sắc nét (6px)', 'Tiêu chuẩn (10px)', 'Bo tròn mềm mại (16px)', 'Viên thuốc (999px)'],
          },
          { key: 'invoiceFooterNote', label: 'Chân trang hóa đơn & phiếu giao hàng', type: 'textarea', span: 2 },
        ],
        toggles: [
          {
            key: 'showPoweredBy',
            label: 'Hiển thị huy hiệu "Vận hành bởi Veylix Commerce"',
            description: 'Hiển thị dòng chữ nhỏ ở cuối trang cửa hàng trực tuyến.',
          },
          {
            key: 'enableWatermark',
            label: 'Đóng dấu bản quyền ảnh sản phẩm tự động',
            description: 'Chèn watermark mờ của thương hiệu ở góc phải dưới ảnh sản phẩm gốc.',
          },
        ],
      },
    ],
  },

  'settings-localization': {
    subtitle: 'Thiết lập ngôn ngữ mặc định, đa tiền tệ, định dạng số liệu và tự động chuyển đổi theo khu vực địa lý.',
    defaults: {
      defaultLanguage: 'Tiếng Việt (vi-VN)',
      fallbackLanguage: 'English (en-US)',
      primaryCurrency: 'USD ($)',
      secondaryCurrency: 'VND (₫)',
      exchangeRateVnd: 25450,
      dateFormat: 'DD/MM/YYYY (30/04/2026)',
      weightUnit: 'Kilogram (kg)',
      dimensionUnit: 'Centimet (cm)',
      autoDetectGeo: true,
      enableMultiCurrencyCheckout: true,
      autoRoundPrices: true,
    },
    sections: [
      {
        title: 'Ngôn ngữ & Đơn vị đo lường',
        desc: 'Áp dụng cho giao diện người mua, thông báo email và thông số đóng gói vận đơn.',
        fields: [
          {
            key: 'defaultLanguage',
            label: 'Ngôn ngữ mặc định cửa hàng',
            type: 'select',
            options: ['Tiếng Việt (vi-VN)', 'English (en-US)', '日本語 (ja-JP)', '한국어 (ko-KR)'],
          },
          {
            key: 'fallbackLanguage',
            label: 'Ngôn ngữ dự phòng khi thiếu bản dịch',
            type: 'select',
            options: ['English (en-US)', 'Tiếng Việt (vi-VN)'],
          },
          {
            key: 'dateFormat',
            label: 'Định dạng ngày tháng',
            type: 'select',
            options: ['DD/MM/YYYY (30/04/2026)', 'MMM DD, YYYY (Apr 30, 2026)', 'YYYY-MM-DD (2026-04-30)'],
          },
          {
            key: 'weightUnit',
            label: 'Đơn vị khối lượng chuẩn',
            type: 'select',
            options: ['Kilogram (kg)', 'Gram (g)', 'Pound (lb)'],
          },
        ],
      },
      {
        title: 'Đa tiền tệ & Tỷ giá quy đổi',
        desc: 'Cấu hình tỷ giá quy đổi giữa USD và VND khi thanh toán nội địa (VNPay / MoMo / COD).',
        fields: [
          {
            key: 'primaryCurrency',
            label: 'Tiền tệ hạch toán gốc',
            type: 'select',
            options: ['USD ($)', 'VND (₫)', 'EUR (€)', 'SGD (S$)'],
          },
          {
            key: 'secondaryCurrency',
            label: 'Tiền tệ hiển thị phụ trợ',
            type: 'select',
            options: ['VND (₫)', 'USD ($)', 'EUR (€)'],
          },
          { key: 'exchangeRateVnd', label: 'Tỷ giá quy đổi 1 USD → VND', type: 'number', min: 1000, step: 50 },
          {
            key: 'dimensionUnit',
            label: 'Đơn vị kích thước kiện hàng',
            type: 'select',
            options: ['Centimet (cm)', 'Inch (in)', 'Mét (m)'],
          },
        ],
        toggles: [
          {
            key: 'autoDetectGeo',
            label: 'Tự động gợi ý ngôn ngữ & tiền tệ theo IP người mua',
            description: 'Nhận diện quốc gia khách truy cập để hiển thị ngôn ngữ phù hợp ngay lần đầu vào /store.',
          },
          {
            key: 'enableMultiCurrencyCheckout',
            label: 'Cho phép thanh toán đa tiền tệ tại bước Checkout',
            description: 'Tự động quy đổi sang VND cho cổng nội địa và giữ USD cho cổng Stripe quốc tế.',
          },
          {
            key: 'autoRoundPrices',
            label: 'Làm tròn giá đẹp sau khi quy đổi tỷ giá',
            description: 'Làm tròn mức giá lẻ sang bội số dễ đọc (VD: $24.00 hoặc 599.000₫).',
          },
        ],
      },
    ],
  },

  'settings-seo': {
    subtitle: 'Tối ưu hóa thứ hạng tìm kiếm Google, thẻ Open Graph mạng xã hội, sơ đồ trang Sitemap và chỉ mục Robots.',
    previewType: 'seo',
    defaults: {
      metaTitle: 'Veylix Studio — Thời trang, Balo & Phụ kiện Tối Giản Cao Cấp',
      metaDescription:
        'Khám phá các thiết kế tối giản, chất liệu bền vững từ Veylix Studio. Miễn phí vận chuyển cho đơn từ $50, đổi trả dễ dàng trong 30 ngày.',
      metaKeywords: 'veylix studio, thời trang tối giản, balo chống nước, phụ kiện bàn làm việc, đồ gia dụng bắc âu',
      canonicalUrl: 'https://veylix.vn/store',
      ogImage: '/assets/images/products/minimal-backpack.png',
      twitterHandle: '@veylixstudio',
      sitemapEnabled: true,
      robotsIndex: true,
      structuredDataJsonLd: true,
      autoRedirectBrokenUrls: true,
    },
    sections: [
      {
        title: 'Thẻ Meta Tìm kiếm & Chia sẻ Xã hội (Open Graph)',
        desc: 'Kiểm soát cách cửa hàng xuất hiện trên Google Search, Facebook, Zalo và X.',
        fields: [
          { key: 'metaTitle', label: 'Tiêu đề trang chuẩn SEO (Meta Title — tối ưu 50–65 ký tự) *', type: 'text', required: true, span: 2 },
          { key: 'metaDescription', label: 'Mô tả chuẩn SEO (Meta Description — tối ưu 140–160 ký tự) *', type: 'textarea', required: true, span: 2 },
          { key: 'canonicalUrl', label: 'Đường dẫn chuẩn hóa (Canonical URL)', type: 'text' },
          { key: 'ogImage', label: 'Ảnh đại diện khi chia sẻ liên kết (OG Image)', type: 'text' },
          { key: 'metaKeywords', label: 'Từ khóa trọng tâm (cách nhau bằng dấu phẩy)', type: 'text' },
          { key: 'twitterHandle', label: 'Tài khoản mạng xã hội chính thức', type: 'text' },
        ],
      },
      {
        title: 'Lập chỉ mục & Kỹ thuật SEO tự động',
        desc: 'Hỗ trợ công cụ tìm kiếm thu thập dữ liệu sản phẩm và đánh giá sao Rich Snippets.',
        toggles: [
          {
            key: 'sitemapEnabled',
            label: 'Tự động sinh & cập nhật Sitemap.xml thời gian thực',
            description: 'Tự động thêm URL mới ngay khi đăng sản phẩm, danh mục hoặc bài viết blog mới.',
          },
          {
            key: 'robotsIndex',
            label: 'Cho phép Google & công cụ tìm kiếm lập chỉ mục (Index, Follow)',
            description: 'Tắt tùy chọn này nếu cửa hàng đang trong giai đoạn thử nghiệm nội bộ.',
          },
          {
            key: 'structuredDataJsonLd',
            label: 'Nhúng dữ liệu có cấu trúc Schema.org (Product & Review JSON-LD)',
            description: 'Hiển thị giá bán, tình trạng còn hàng và điểm đánh giá sao ngay trên kết quả Google.',
          },
          {
            key: 'autoRedirectBrokenUrls',
            label: 'Tự động chuyển hướng 301 khi đổi đường dẫn (Slug) sản phẩm',
            description: 'Ngăn lỗi 404 và bảo toàn điểm chất lượng SEO từ các liên kết cũ.',
          },
        ],
      },
    ],
  },

  'settings-maintenance': {
    subtitle: 'Bật/tắt chế độ bảo trì đối với giao diện Cửa hàng người dùng (/store) mà vẫn cho phép Quản trị viên kiểm tra.',
    previewType: 'maintenance',
    defaults: {
      enabled: false,
      title: 'Veylix Store đang nâng cấp trải nghiệm mua sắm',
      message:
        'Chúng tôi đang cập nhật bộ sưu tập mùa mới và nâng cấp hạ tầng thanh toán. Cửa hàng sẽ mở cửa trở lại trong ít phút nữa!',
      estimatedReturn: '2026-05-01 08:00 (GMT+7)',
      supportEmail: 'support@veylix.vn',
      allowAdminBypass: true,
      collectLeadEmails: true,
      preserveCartSession: true,
    },
    sections: [
      {
        title: 'Trạng thái Đóng / Mở Cửa hàng Trực tuyến (/store)',
        desc: 'Khi bật chế độ bảo trì, khách truy cập /store sẽ thấy màn hình thông báo bảo trì sang trọng thay vì đặt hàng.',
        toggles: [
          {
            key: 'enabled',
            label: 'Bật chế độ bảo trì cửa hàng (/store)',
            description: 'Tạm ngưng nhận đơn mới trên Storefront và hiển thị thông điệp bảo trì bên dưới.',
          },
          {
            key: 'allowAdminBypass',
            label: 'Cho phép Quản trị viên xem nhanh lối tắt quay về Admin',
            description: 'Hiển thị nút truy cập Quản trị dành cho chủ cửa hàng trên trang bảo trì.',
          },
          {
            key: 'collectLeadEmails',
            label: 'Cho phép khách để lại Email nhận thông báo khi mở lại',
            description: 'Tự động lưu email khách hàng quan tâm để gửi mã ưu đãi chào mừng.',
          },
          {
            key: 'preserveCartSession',
            label: 'Bảo lưu giỏ hàng hiện tại của khách trong suốt thời gian bảo trì',
            description: 'Giữ nguyên sản phẩm khách đã chọn để thanh toán ngay khi hệ thống mở lại.',
          },
        ],
      },
      {
        title: 'Nội dung Thông báo & Thời gian Mở lại Dự kiến',
        desc: 'Thông tin minh bạch giúp giữ trọn niềm tin của khách hàng trong lúc nâng cấp hệ thống.',
        fields: [
          { key: 'title', label: 'Tiêu đề màn hình bảo trì *', type: 'text', required: true, span: 2 },
          { key: 'message', label: 'Thông điệp gửi tới khách hàng *', type: 'textarea', required: true, span: 2 },
          { key: 'estimatedReturn', label: 'Thời gian dự kiến mở lại cửa hàng', type: 'text' },
          { key: 'supportEmail', label: 'Email hỗ trợ khẩn cấp cho đơn hàng đã đặt', type: 'email' },
        ],
      },
    ],
  },

  'settings-marketing': {
    subtitle: 'Kết nối mã theo dõi chuyển đổi Google Analytics 4, Meta Pixel, TikTok Pixel và tự động hóa tiếp thị lại.',
    defaults: {
      ga4MeasurementId: 'G-VX928410KP',
      metaPixelId: '884920174629104',
      tiktokPixelId: 'C9V8K23C77U4019',
      utmDefaultSource: 'veylix_storefront',
      abandonedCartDelayMinutes: 45,
      welcomeCouponCode: 'HELLO10',
      enableConversionApi: true,
      enableAbandonedCartEmail: true,
      cookieConsentBanner: true,
    },
    sections: [
      {
        title: 'Mã Pixel & Công cụ Đo lường Chuyển đổi',
        desc: 'Theo dõi chính xác sự kiện Xem sản phẩm, Thêm vào giỏ, Bắt đầu thanh toán và Hoàn tất đơn hàng.',
        fields: [
          { key: 'ga4MeasurementId', label: 'Google Analytics 4 (Measurement ID)', type: 'text' },
          { key: 'metaPixelId', label: 'Meta / Facebook Pixel ID', type: 'text' },
          { key: 'tiktokPixelId', label: 'TikTok Ads Pixel ID', type: 'text' },
          { key: 'utmDefaultSource', label: 'Nguồn UTM mặc định cho liên kết chia sẻ', type: 'text' },
        ],
      },
      {
        title: 'Tiếp thị lại Giỏ hàng Bỏ quên & Ưu đãi Chào mừng',
        desc: 'Tăng tỷ lệ chuyển đổi tự động cho khách hàng lần đầu và khách chưa hoàn tất thanh toán.',
        fields: [
          { key: 'abandonedCartDelayMinutes', label: 'Thời gian chờ gửi nhắc giỏ hàng bỏ quên (phút)', type: 'number', min: 15, max: 1440 },
          { key: 'welcomeCouponCode', label: 'Mã giảm giá tặng khách đăng ký bản tin mới', type: 'text' },
        ],
        toggles: [
          {
            key: 'enableConversionApi',
            label: 'Bật Server-side Conversion API (CAPI)',
            description: 'Gửi sự kiện mua hàng trực tiếp từ máy chủ để tránh thất thoát dữ liệu do trình chặn quảng cáo.',
          },
          {
            key: 'enableAbandonedCartEmail',
            label: 'Tự động gửi Email khôi phục giỏ hàng bỏ quên',
            description: 'Nhắc khách hoàn tất đơn hàng kèm đường dẫn khôi phục giỏ hàng 1 chạm.',
          },
          {
            key: 'cookieConsentBanner',
            label: 'Hiển thị thanh đồng ý quyền riêng tư Cookie (GDPR/PDPD)',
            description: 'Tuân thủ quy định bảo vệ dữ liệu cá nhân của người tiêu dùng.',
          },
        ],
      },
    ],
  },

  'settings-notifications': {
    subtitle: 'Cấu hình kênh cảnh báo vận hành cho đội ngũ quản trị và tin nhắn trạng thái đơn hàng gửi khách mua.',
    defaults: {
      adminAlertEmail: 'ops@veylix.vn',
      slackWebhookUrl: 'https://hooks.slack.com/services/T00VEYLIX/B00OPS/veylix-alerts',
      lowStockThreshold: 15,
      highValueOrderThreshold: 250,
      notifyNewOrder: true,
      notifyLowStock: true,
      notifyNegativeReview: true,
      notifyRefundRequest: true,
      customerOrderSms: true,
      dailyDigestReport: true,
    },
    sections: [
      {
        title: 'Kênh Nhận Cảnh Báo Quản Trị & Ngưỡng Kích Hoạt',
        desc: 'Đảm bảo bộ phận Kho vận và CSKH nắm bắt ngay các sự kiện quan trọng.',
        fields: [
          { key: 'adminAlertEmail', label: 'Email nhận cảnh báo vận hành *', type: 'email', required: true },
          { key: 'slackWebhookUrl', label: 'Webhook Slack / Microsoft Teams nội bộ', type: 'text' },
          { key: 'lowStockThreshold', label: 'Ngưỡng tồn kho tối thiểu phát cảnh báo (đơn vị)', type: 'number', min: 1 },
          { key: 'highValueOrderThreshold', label: 'Ngưỡng đơn hàng giá trị cao VIP ($)', type: 'number', min: 50 },
        ],
      },
      {
        title: 'Sự Kiện Bật / Tắt Thông Báo Tự Động',
        desc: 'Tùy chỉnh chi tiết từng sự kiện gửi thông báo trên Topbar, Email và SMS.',
        toggles: [
          { key: 'notifyNewOrder', label: 'Thông báo ngay khi có đơn hàng mới phát sinh', description: 'Cập nhật tức thì chuông thông báo trên Topbar Admin.' },
          { key: 'notifyLowStock', label: 'Cảnh báo SKU chạm ngưỡng sắp hết hàng hoặc hết hàng', description: 'Gửi cảnh báo cho Quản lý kho để lập kế hoạch nhập hàng.' },
          { key: 'notifyNegativeReview', label: 'Cảnh báo ưu tiên khi có đánh giá 1–2 sao', description: 'Chuyển ngay cho bộ phận CSKH phản hồi trong vòng 2 giờ.' },
          { key: 'notifyRefundRequest', label: 'Thông báo yêu cầu trả hàng / hoàn tiền mới', description: 'Gửi tới Kế toán và Quản lý đơn hàng để xét duyệt.' },
          { key: 'customerOrderSms', label: 'Gửi Email & SMS hành trình đơn hàng cho người mua', description: 'Thông báo tự động khi Xác nhận đơn, Đang giao và Giao thành công.' },
          { key: 'dailyDigestReport', label: 'Báo cáo tổng kết doanh thu & vận hành 08:00 sáng hàng ngày', description: 'Gửi bản tóm tắt GMV, số đơn và tồn kho qua email quản trị.' },
        ],
      },
    ],
  },

  'settings-email': {
    subtitle: 'Thiết lập máy chủ gửi thư giao dịch SMTP, chữ ký thương hiệu và xác thực chống rơi vào hộp thư rác.',
    previewType: 'email-test',
    defaults: {
      provider: 'Amazon SES (Production Relay)',
      smtpHost: 'email-smtp.ap-southeast-1.amazonaws.com',
      smtpPort: 587,
      senderName: 'Veylix Studio Support',
      senderEmail: 'no-reply@veylix.vn',
      replyToEmail: 'support@veylix.vn',
      emailSignature: 'Trân trọng,\nĐội ngũ Chăm sóc Khách hàng Veylix Studio\nHotline: +84 28 3822 1234',
      useTls: true,
      dkimVerified: true,
      bccAdminOnInvoice: false,
    },
    sections: [
      {
        title: 'Máy Chủ Gửi Thư Giao Dịch (SMTP / API)',
        desc: 'Dùng để gửi xác nhận đơn hàng, hóa đơn điện tử, mã ưu đãi và khôi phục tài khoản.',
        fields: [
          {
            key: 'provider',
            label: 'Nhà cung cấp dịch vụ Email',
            type: 'select',
            options: ['Amazon SES (Production Relay)', 'SendGrid API', 'Postmark Transactional', 'Google Workspace SMTP'],
          },
          { key: 'smtpHost', label: 'Máy chủ SMTP Host *', type: 'text', required: true },
          { key: 'smtpPort', label: 'Cổng kết nối (Port)', type: 'number', min: 25, max: 65535 },
          { key: 'senderName', label: 'Tên người gửi hiển thị *', type: 'text', required: true },
          { key: 'senderEmail', label: 'Địa chỉ Email gửi đi *', type: 'email', required: true },
          { key: 'replyToEmail', label: 'Địa chỉ nhận phản hồi (Reply-To)', type: 'email' },
          { key: 'emailSignature', label: 'Chữ ký mặc định cuối mỗi Email', type: 'textarea', span: 2 },
        ],
        toggles: [
          { key: 'useTls', label: 'Bắt buộc mã hóa đường truyền STARTTLS / SSL', description: 'Bảo vệ an toàn tuyệt đối nội dung hóa đơn và thông tin khách hàng.' },
          { key: 'dkimVerified', label: 'Kích hoạt chữ ký số DKIM & SPF chống giả mạo tên miền', description: 'Đảm bảo tỷ lệ vào hộp thư chính (Inbox) đạt trên 99.4%.' },
          { key: 'bccAdminOnInvoice', label: 'Gửi bản sao ẩn (BCC) mọi hóa đơn mới về hộp thư Kế toán', description: 'Lưu trữ đối chiếu chứng từ tự động tại finance@veylix.vn.' },
        ],
      },
    ],
  },

  'settings-storage': {
    subtitle: 'Quản lý hạ tầng lưu trữ đám mây CDN, tối ưu định dạng ảnh sản phẩm và lịch trình sao lưu cơ sở dữ liệu.',
    previewType: 'storage',
    defaults: {
      storageProvider: 'Cloudflare R2 + Global CDN',
      bucketName: 'veylix-commerce-assets-prod',
      region: 'ap-southeast-1 (Singapore)',
      cdnDomain: 'https://cdn.veylix.vn',
      maxUploadSizeMb: 25,
      usedStorageGb: 18.4,
      quotaStorageGb: 100,
      backupRetentionDays: 30,
      autoConvertWebp: true,
      autoDailyBackup: true,
      signedPrivateUrls: true,
    },
    sections: [
      {
        title: 'Hạ Tầng Lưu Trữ Đám Mây & Mạng Phân Phối CDN',
        desc: 'Tăng tốc độ tải ảnh sản phẩm trên Storefront và bảo vệ tệp chứng từ nội bộ.',
        fields: [
          {
            key: 'storageProvider',
            label: 'Nhà cung cấp Object Storage',
            type: 'select',
            options: ['Cloudflare R2 + Global CDN', 'Amazon S3 + CloudFront', 'Google Cloud Storage', 'Lưu trữ cục bộ (Local Disk)'],
          },
          { key: 'bucketName', label: 'Tên Bucket lưu trữ *', type: 'text', required: true },
          {
            key: 'region',
            label: 'Khu vực máy chủ (Region)',
            type: 'select',
            options: ['ap-southeast-1 (Singapore)', 'ap-northeast-1 (Tokyo)', 'us-east-1 (Virginia)', 'eu-central-1 (Frankfurt)'],
          },
          { key: 'cdnDomain', label: 'Tên miền CDN phân phối ảnh', type: 'text' },
          { key: 'maxUploadSizeMb', label: 'Giới hạn dung lượng mỗi tệp tải lên (MB)', type: 'number', min: 2, max: 500 },
          { key: 'backupRetentionDays', label: 'Thời gian lưu bản sao lưu MongoDB (ngày)', type: 'number', min: 7, max: 365 },
        ],
        toggles: [
          { key: 'autoConvertWebp', label: 'Tự động nén & chuyển đổi ảnh sản phẩm sang WebP / AVIF', description: 'Giảm 65% dung lượng ảnh mà vẫn giữ độ sắc nét chuẩn Retina.' },
          { key: 'autoDailyBackup', label: 'Sao lưu tự động toàn bộ cơ sở dữ liệu lúc 02:00 sáng hàng ngày', description: 'Lưu trữ bản snapshot mã hóa AES-256 để sẵn sàng khôi phục tức thì.' },
          { key: 'signedPrivateUrls', label: 'Bắt buộc Signed URL có thời hạn cho hóa đơn & hợp đồng đối tác', description: 'Ngăn chặn truy cập trái phép vào các tài liệu tài chính nội bộ.' },
        ],
      },
    ],
  },

  'settings-security': {
    subtitle: 'Thiết lập xác thực 2 lớp (2FA), thời gian phiên đăng nhập, chính sách mật khẩu và tường lửa truy cập.',
    defaults: {
      requireAdmin2fa: true,
      sessionTimeoutMinutes: 120,
      minPasswordLength: 10,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 15,
      ipWhitelist: '127.0.0.1, 10.0.0.0/8, 192.168.1.0/24',
      passwordRequireSymbols: true,
      alertUnrecognizedDevice: true,
      auditSensitiveExports: true,
    },
    sections: [
      {
        title: 'Xác Thực & Quản Lý Phiên Đăng Nhập Quản Trị',
        desc: 'Bảo vệ tài khoản vận hành cửa hàng trước nguy cơ truy cập trái phép.',
        fields: [
          { key: 'sessionTimeoutMinutes', label: 'Thời gian tự động đăng xuất khi không hoạt động (phút)', type: 'number', min: 15, max: 1440 },
          { key: 'minPasswordLength', label: 'Độ dài mật khẩu tối thiểu (ký tự)', type: 'number', min: 8, max: 32 },
          { key: 'maxLoginAttempts', label: 'Số lần nhập sai mật khẩu tối đa trước khi khóa tạm', type: 'number', min: 3, max: 15 },
          { key: 'lockoutDurationMinutes', label: 'Thời gian khóa tạm tài khoản (phút)', type: 'number', min: 5, max: 120 },
          { key: 'ipWhitelist', label: 'Danh sách dải IP tin cậy (cách nhau bằng dấu phẩy)', type: 'text', span: 2 },
        ],
        toggles: [
          { key: 'requireAdmin2fa', label: 'Bắt buộc xác thực hai yếu tố (2FA / Authenticator) cho Quản trị viên', description: 'Áp dụng cho vai trò Chủ sở hữu, Kế toán và Quản lý kho.' },
          { key: 'passwordRequireSymbols', label: 'Yêu cầu mật khẩu chứa chữ hoa, chữ số và ký tự đặc biệt', description: 'Nâng cao độ mạnh mật khẩu cho toàn bộ nhân sự.' },
          { key: 'alertUnrecognizedDevice', label: 'Gửi cảnh báo bảo mật ngay khi đăng nhập từ thiết bị hoặc vị trí lạ', description: 'Gửi email xác minh tức thì kèm nút thu hồi phiên từ xa.' },
          { key: 'auditSensitiveExports', label: 'Ghi nhật ký bắt buộc mọi thao tác xuất CSV dữ liệu khách hàng & tài chính', description: 'Lưu vết đầy đủ người xuất và thời điểm trong Nhật ký hoạt động (/commerce/audit).' },
        ],
      },
    ],
  },

  taxes: {
    subtitle: 'Quản lý thuế giá trị gia tăng (VAT), thuế nhập khẩu, quy tắc hiển thị giá và mã số thuế xuất hóa đơn.',
    previewType: 'tax',
    defaults: {
      vatRate: 8,
      luxuryImportTaxRate: 10,
      ecoPackagingTaxRate: 0,
      companyTaxId: '0316894210',
      companyLegalName: 'CÔNG TY TNHH THƯƠNG MẠI & THIẾT KẾ VEYLIX VIỆT NAM',
      taxCalculationMode: 'Cộng thuế VAT tại bước thanh toán (Exclusive)',
      pricesIncludeTax: false,
      taxOnShipping: false,
      enableEInvoice: true,
    },
    sections: [
      {
        title: 'Mức Thuế Suất & Thông Tin Pháp Nhân Xuất Hóa Đơn',
        desc: 'Đồng bộ trực tiếp với bộ tính tổng thanh toán trên trang Checkout (/store/checkout).',
        fields: [
          { key: 'vatRate', label: 'Thuế suất GTGT / VAT tiêu chuẩn (%) *', type: 'number', min: 0, max: 50, step: 0.5, required: true },
          { key: 'luxuryImportTaxRate', label: 'Thuế nhập khẩu hàng xa xỉ / quốc tế (%)', type: 'number', min: 0, max: 100, step: 0.5 },
          { key: 'companyTaxId', label: 'Mã số thuế doanh nghiệp (MST)', type: 'text' },
          {
            key: 'taxCalculationMode',
            label: 'Phương pháp tính thuế trên giỏ hàng',
            type: 'select',
            options: [
              'Cộng thuế VAT tại bước thanh toán (Exclusive)',
              'Giá niêm yết đã bao gồm thuế VAT (Inclusive)',
            ],
          },
          { key: 'companyLegalName', label: 'Tên pháp nhân trên hóa đơn GTGT điện tử', type: 'text', span: 2 },
        ],
        toggles: [
          { key: 'pricesIncludeTax', label: 'Hiển thị giá sản phẩm đã bao gồm thuế trên Storefront', description: 'Nếu tắt, thuế VAT sẽ được tách dòng minh bạch tại bước Checkout.' },
          { key: 'taxOnShipping', label: 'Áp dụng thuế VAT trên cả cước phí vận chuyển', description: 'Tính thêm phần trăm VAT vào phí giao hàng tiêu chuẩn và hỏa tốc.' },
          { key: 'enableEInvoice', label: 'Cho phép khách hàng yêu cầu xuất hóa đơn đỏ (e-Invoice) khi đặt hàng', description: 'Hiển thị tùy chọn nhập Mã số thuế công ty trên trang thanh toán.' },
        ],
      },
    ],
  },

  'shipping-rules': {
    subtitle: 'Thiết lập biểu phí giao hàng nội thành/ngoại tỉnh, ngưỡng miễn phí vận chuyển và đối tác giao vận ưu tiên.',
    previewType: 'shipping',
    defaults: {
      innerCityFee: 5,
      outerProvinceFee: 8,
      expressFee: 15,
      freeShippingThreshold: 50,
      defaultCarrier: 'Giao Hàng Tiết Kiệm (GHTK)',
      processingSlaHours: 24,
      enableFreeShipping: true,
      enableExpress2h: true,
      allowStorePickup: true,
    },
    sections: [
      {
        title: 'Biểu Phí Vận Chuyển & Ngưỡng Freeship Toàn Quốc',
        desc: 'Áp dụng trực tiếp cho thanh tiến trình Miễn phí vận chuyển trên Giỏ hàng Storefront (/store).',
        fields: [
          { key: 'innerCityFee', label: 'Phí giao tiêu chuẩn Nội thành ($)', type: 'number', min: 0, step: 0.5 },
          { key: 'outerProvinceFee', label: 'Phí giao Nhanh liên tỉnh ($)', type: 'number', min: 0, step: 0.5 },
          { key: 'expressFee', label: 'Phí giao Hỏa tốc DHL / 2H ($)', type: 'number', min: 0, step: 0.5 },
          { key: 'freeShippingThreshold', label: 'Ngưỡng đơn hàng được Miễn phí vận chuyển ($)', type: 'number', min: 0, step: 1 },
          {
            key: 'defaultCarrier',
            label: 'Đơn vị vận chuyển mặc định khi tạo vận đơn',
            type: 'select',
            options: ['Giao Hàng Tiết Kiệm (GHTK)', 'Giao Hàng Nhanh (GHN)', 'Viettel Post', 'DHL Express'],
          },
          { key: 'processingSlaHours', label: 'Cam kết thời gian đóng gói xuất kho (giờ)', type: 'number', min: 1, max: 120 },
        ],
        toggles: [
          { key: 'enableFreeShipping', label: 'Kích hoạt chương trình Miễn phí vận chuyển khi đạt ngưỡng đơn hàng', description: 'Tự động đưa phí ship về $0 khi tạm tính đạt mức ngưỡng quy định.' },
          { key: 'enableExpress2h', label: 'Mở tùy chọn Giao hỏa tốc nội thành 2 giờ (TP.HCM & Hà Nội)', description: 'Chỉ hiển thị cho các địa chỉ thuộc khu vực kho trung tâm còn tồn kho.' },
          { key: 'allowStorePickup', label: 'Cho phép khách Nhận trực tiếp tại Showroom (Click & Collect — $0 phí ship)', description: 'Giữ hàng tại cửa hàng Quận 1 trong vòng 48 giờ kể từ lúc đặt.' },
        ],
      },
    ],
  },

  checkout: {
    subtitle: 'Tối ưu trải nghiệm trang Thanh toán (/store/checkout) nhằm giảm tỷ lệ bỏ giỏ và tăng giá trị đơn hàng.',
    defaults: {
      checkoutLayout: 'Thanh toán 1 trang tinh gọn (One-page Checkout)',
      cartReservationMinutes: 30,
      minOrderAmount: 10,
      maxOrderItems: 50,
      thankYouBannerNote: 'Đơn hàng của bạn đã được tiếp nhận! Bạn có thể tra cứu lộ trình giao hàng bất kỳ lúc nào.',
      allowGuestCheckout: true,
      requirePhoneNumber: true,
      autoApplyBestCoupon: false,
      showOrderNotesField: true,
      enableOneClickReorder: true,
    },
    sections: [
      {
        title: 'Luồng Đặt Hàng & Ràng Buộc Giỏ Hàng',
        desc: 'Cân bằng giữa tốc độ chốt đơn nhanh và đầy đủ thông tin giao nhận.',
        fields: [
          {
            key: 'checkoutLayout',
            label: 'Bố cục trang thanh toán',
            type: 'select',
            options: [
              'Thanh toán 1 trang tinh gọn (One-page Checkout)',
              'Thanh toán 3 bước có hướng dẫn (Multi-step)',
            ],
          },
          { key: 'cartReservationMinutes', label: 'Thời gian giữ chỗ tồn kho khi đang thanh toán (phút)', type: 'number', min: 5, max: 180 },
          { key: 'minOrderAmount', label: 'Giá trị đơn hàng tối thiểu ($)', type: 'number', min: 0 },
          { key: 'maxOrderItems', label: 'Số lượng sản phẩm tối đa trong 1 đơn', type: 'number', min: 1, max: 500 },
          { key: 'thankYouBannerNote', label: 'Thông điệp cảm ơn sau khi đặt hàng thành công', type: 'textarea', span: 2 },
        ],
        toggles: [
          { key: 'allowGuestCheckout', label: 'Cho phép đặt hàng nhanh không cần đăng ký tài khoản (Guest Checkout)', description: 'Khách vãng lai chỉ cần nhập họ tên, email, SĐT và địa chỉ nhận hàng.' },
          { key: 'requirePhoneNumber', label: 'Bắt buộc nhập Số điện thoại người nhận để Bưu tá liên hệ', description: 'Giảm 85% tỷ lệ giao hàng thất bại hoặc hoàn đơn.' },
          { key: 'autoApplyBestCoupon', label: 'Tự động gợi ý các mã giảm giá khả dụng ngay tại ô Voucher', description: 'Hiển thị chip mã HELLO10, WELCOME20, SHIPFREE để khách chọn 1 chạm.' },
          { key: 'showOrderNotesField', label: 'Hiển thị ô Ghi chú giao hàng (giờ hành chính, gửi lễ tân, gói quà...)', description: 'Lưu ghi chú trực tiếp vào chi tiết đơn hàng của Admin.' },
        ],
      },
    ],
  },

  methods: {
    subtitle: 'Bật/tắt các phương thức thanh toán trên Storefront, cấu hình phụ phí COD và hướng dẫn chuyển khoản.',
    defaults: {
      defaultPaymentMethod: 'Thanh toán khi nhận hàng (COD)',
      codMaxOrderLimit: 500,
      codSurcharge: 0,
      bankAccountInfo: 'Vietcombank CN TP.HCM · STK: 0071009988776 · CTK: CONG TY TNHH VEYLIX VIET NAM',
      enableCod: true,
      enableVnpayQr: true,
      enableMomo: true,
      enableStripeCard: true,
      autoCaptureCard: true,
    },
    sections: [
      {
        title: 'Các Phương Thức Thanh Toán Được Chấp Nhận',
        desc: 'Hiển thị trực tiếp tại bước chọn hình thức thanh toán của người mua.',
        toggles: [
          { key: 'enableCod', label: 'Thanh toán tiền mặt khi nhận hàng (COD)', description: 'Phổ biến và tiện lợi nhất cho khách mua hàng nội địa.' },
          { key: 'enableVnpayQr', label: 'Cổng thanh toán VNPay QR & Thẻ ATM Nội địa (40+ ngân hàng)', description: 'Quét mã VietQR xác nhận thanh toán tự động trong 5 giây.' },
          { key: 'enableMomo', label: 'Ví điện tử MoMo Super App', description: 'Thanh toán nhanh trên di động không cần nhập số thẻ.' },
          { key: 'enableStripeCard', label: 'Thẻ Quốc tế Visa / Mastercard / Apple Pay (qua Stripe)', description: 'Hỗ trợ chuẩn bảo mật 3D Secure 2.0 chống gian lận thẻ.' },
          { key: 'autoCaptureCard', label: 'Tự động gạch nợ (Auto-capture) ngay khi ngân hàng xác thực thẻ thành công', description: 'Đổi trạng thái đơn sang Đã thanh toán (Paid) ngay lập tức.' },
        ],
      },
      {
        title: 'Hạn Mức Thu Hộ COD & Thông Tin Chuyển Khoản',
        desc: 'Kiểm soát rủi ro đơn hàng giá trị lớn và cung cấp hướng dẫn rõ ràng.',
        fields: [
          {
            key: 'defaultPaymentMethod',
            label: 'Phương thức chọn sẵn mặc định',
            type: 'select',
            options: ['Thanh toán khi nhận hàng (COD)', 'VNPay QR', 'Ví MoMo', 'Thẻ quốc tế Stripe'],
          },
          { key: 'codMaxOrderLimit', label: 'Hạn mức đơn hàng tối đa cho phép chọn COD ($)', type: 'number', min: 20 },
          { key: 'codSurcharge', label: 'Phụ phí thu hộ COD ($ — nhập 0 để miễn phí)', type: 'number', min: 0, step: 0.5 },
          { key: 'bankAccountInfo', label: 'Thông tin tài khoản ngân hàng đối ứng (hiển thị trên phiếu thanh toán)', type: 'text' },
        ],
      },
    ],
  },

  commissions: {
    subtitle: 'Thiết lập tỷ lệ chiết khấu hoa hồng sàn theo ngành hàng, phí cổng thanh toán và chu kỳ quyết toán đối tác.',
    defaults: {
      defaultCommissionRate: 12,
      fashionCommissionRate: 14,
      techCommissionRate: 8,
      homeLivingCommissionRate: 11,
      paymentGatewayFeeRate: 2.2,
      payoutCycle: 'Định kỳ thứ Sáu hàng tuần (T+7)',
      minPayoutAmount: 50,
      autoApproveSmallPayout: false,
      deductReturnFeeFromVendor: true,
    },
    sections: [
      {
        title: 'Biểu Phí Hoa Hồng Sàn Theo Ngành Hàng (%)',
        desc: 'Tự động khấu trừ khi đơn hàng của đối tác chuyển sang trạng thái Đã giao thành công.',
        fields: [
          { key: 'defaultCommissionRate', label: 'Hoa hồng sàn mặc định (%) *', type: 'number', min: 0, max: 60, step: 0.5, required: true },
          { key: 'fashionCommissionRate', label: 'Ngành Thời trang & Phụ kiện (%)', type: 'number', min: 0, max: 60, step: 0.5 },
          { key: 'techCommissionRate', label: 'Ngành Thiết bị Công nghệ (%)', type: 'number', min: 0, max: 60, step: 0.5 },
          { key: 'homeLivingCommissionRate', label: 'Ngành Đồ gia dụng & Nội thất (%)', type: 'number', min: 0, max: 60, step: 0.5 },
          { key: 'paymentGatewayFeeRate', label: 'Phí xử lý giao dịch thẻ/ví (%)', type: 'number', min: 0, max: 10, step: 0.1 },
          { key: 'minPayoutAmount', label: 'Số dư tối thiểu để yêu cầu rút tiền ($)', type: 'number', min: 10 },
          {
            key: 'payoutCycle',
            label: 'Chu kỳ đối soát & thanh toán đối tác',
            type: 'select',
            options: ['Định kỳ thứ Sáu hàng tuần (T+7)', '2 lần mỗi tháng (Ngày 1 & 15)', 'Cuối mỗi tháng (T+30)'],
            span: 2,
          },
        ],
        toggles: [
          { key: 'autoApproveSmallPayout', label: 'Tự động duyệt lệnh quyết toán dưới $500 cho đối tác hạng Vàng', description: 'Rút ngắn thời gian nhận tiền cho các gian hàng uy tín lâu năm.' },
          { key: 'deductReturnFeeFromVendor', label: 'Khấu trừ cước vận chuyển chiều về vào công nợ đối tác nếu lỗi do sản phẩm', description: 'Đảm bảo công bằng chi phí vận hành khi hàng giao sai mô tả.' },
        ],
      },
    ],
  },

  'settings-marketplace': {
    subtitle: 'Quy chuẩn kiểm duyệt gian hàng mới, tiêu chuẩn đăng tải sản phẩm, SLA xử lý khiếu nại và bảo vệ người mua.',
    defaults: {
      returnWindowDays: 30,
      vendorResponseSlaHours: 12,
      lateShipmentPenaltyPercent: 3,
      minVendorRatingThreshold: 4.2,
      onboardingPolicySummary:
        'Đối tác cam kết cung cấp sản phẩm chính hãng 100%, hình ảnh thực tế trung thực và xuất kho đúng hẹn trong vòng 24 giờ làm việc.',
      autoApproveNewVendors: false,
      requireProductModeration: true,
      requireBusinessLicense: true,
      buyerProtectionEscrow: true,
    },
    sections: [
      {
        title: 'Quy Tắc Kiểm Duyệt & Đảm Bảo Chất Lượng Sàn',
        desc: 'Kiểm soát chặt chẽ chất lượng nhà bán hàng và hàng hóa niêm yết trên Veylix Marketplace.',
        toggles: [
          { key: 'autoApproveNewVendors', label: 'Tự động kích hoạt hồ sơ đối tác đăng ký mới không cần xét duyệt tay', description: 'Khuyến nghị TẮT để bộ phận vận hành thẩm định giấy phép trước khi mở bán.' },
          { key: 'requireProductModeration', label: 'Bắt buộc kiểm duyệt nội dung & hình ảnh sản phẩm mới trước khi lên kệ', description: 'Sản phẩm đối tác đăng mới sẽ vào hàng đợi Phê duyệt sản phẩm (/commerce/approvals).' },
          { key: 'requireBusinessLicense', label: 'Yêu cầu tải lên Giấy phép kinh doanh & Mã số thuế hợp lệ', description: 'Áp dụng bắt buộc cho mọi gian hàng chính hãng (Mall / Official Store).' },
          { key: 'buyerProtectionEscrow', label: 'Giữ tiền tạm khóa (Escrow) cho tới khi hết hạn khiếu nại đổi trả của người mua', description: 'Bảo vệ quyền lợi khách hàng 100% trong trường hợp phát sinh tranh chấp.' },
        ],
      },
      {
        title: 'Cam Kết Dịch Vụ (SLA) & Chế Tài Vận Hành',
        desc: 'Các chỉ số đo lường hiệu suất gian hàng hàng tháng.',
        fields: [
          { key: 'returnWindowDays', label: 'Thời hạn đổi trả miễn phí tối thiểu (ngày)', type: 'number', min: 3, max: 90 },
          { key: 'vendorResponseSlaHours', label: 'Thời hạn phản hồi khiếu nại tối đa (giờ)', type: 'number', min: 1, max: 72 },
          { key: 'lateShipmentPenaltyPercent', label: 'Phí phạt giao hàng trễ hạn (%)', type: 'number', min: 0, max: 25, step: 0.5 },
          { key: 'minVendorRatingThreshold', label: 'Điểm đánh giá tối thiểu duy trì gian hàng (sao)', type: 'number', min: 1, max: 5, step: 0.1 },
          { key: 'onboardingPolicySummary', label: 'Điều khoản cam kết chất lượng dành cho Đối tác Sàn', type: 'textarea', span: 2 },
        ],
      },
    ],
  },
};

// ==========================================
// NHÓM 2: MA TRẬN PHÂN QUYỀN (5 VAI TRÒ × 6 PHÂN HỆ × 4 QUYỀN)
// ==========================================
export const PERMISSION_ROLES = [
  { id: 'owner', label: 'Owner', fullName: 'Chủ sở hữu (Owner)', badge: 'green' },
  { id: 'warehouse', label: 'Quản lý kho', fullName: 'Quản lý kho vận', badge: 'blue' },
  { id: 'support', label: 'CSKH', fullName: 'Chuyên viên CSKH', badge: 'amber' },
  { id: 'marketing', label: 'Tiếp thị', fullName: 'Chuyên viên Tiếp thị', badge: 'purple' },
  { id: 'accountant', label: 'Kế toán', fullName: 'Kế toán tài chính', badge: 'green' },
];

export const PERMISSION_RESOURCES = [
  { id: 'products', label: 'Sản phẩm', desc: 'Danh mục, biến thể, thương hiệu & giá bán' },
  { id: 'orders', label: 'Đơn hàng', desc: 'Xử lý đơn, vận đơn, đổi trả & hoàn tiền' },
  { id: 'inventory', label: 'Kho hàng', desc: 'Tồn kho, chuyển kho, kiểm kê & nhà cung cấp' },
  { id: 'customers', label: 'Khách hàng', desc: 'Hồ sơ người mua, phân khúc, đánh giá & hộp thư' },
  { id: 'finance', label: 'Tài chính', desc: 'Giao dịch, quyết toán sàn, thuế & báo cáo doanh số' },
  { id: 'settings', label: 'Cài đặt', desc: 'Cấu hình cửa hàng, SEO, bảo trì & phân quyền' },
];

export const PERMISSION_ACTIONS = [
  { id: 'view', label: 'Xem' },
  { id: 'create', label: 'Thêm' },
  { id: 'edit', label: 'Sửa' },
  { id: 'delete', label: 'Xóa' },
];

export function createDefaultPermissionMatrix() {
  return {
    products: {
      view: { owner: true, warehouse: true, support: true, marketing: true, accountant: true },
      create: { owner: true, warehouse: true, support: false, marketing: true, accountant: false },
      edit: { owner: true, warehouse: true, support: false, marketing: true, accountant: false },
      delete: { owner: true, warehouse: false, support: false, marketing: false, accountant: false },
    },
    orders: {
      view: { owner: true, warehouse: true, support: true, marketing: true, accountant: true },
      create: { owner: true, warehouse: false, support: true, marketing: false, accountant: false },
      edit: { owner: true, warehouse: true, support: true, marketing: false, accountant: true },
      delete: { owner: true, warehouse: false, support: false, marketing: false, accountant: false },
    },
    inventory: {
      view: { owner: true, warehouse: true, support: true, marketing: false, accountant: true },
      create: { owner: true, warehouse: true, support: false, marketing: false, accountant: false },
      edit: { owner: true, warehouse: true, support: false, marketing: false, accountant: false },
      delete: { owner: true, warehouse: true, support: false, marketing: false, accountant: false },
    },
    customers: {
      view: { owner: true, warehouse: false, support: true, marketing: true, accountant: true },
      create: { owner: true, warehouse: false, support: true, marketing: true, accountant: false },
      edit: { owner: true, warehouse: false, support: true, marketing: true, accountant: false },
      delete: { owner: true, warehouse: false, support: false, marketing: false, accountant: false },
    },
    finance: {
      view: { owner: true, warehouse: false, support: false, marketing: false, accountant: true },
      create: { owner: true, warehouse: false, support: false, marketing: false, accountant: true },
      edit: { owner: true, warehouse: false, support: false, marketing: false, accountant: true },
      delete: { owner: true, warehouse: false, support: false, marketing: false, accountant: false },
    },
    settings: {
      view: { owner: true, warehouse: false, support: false, marketing: true, accountant: false },
      create: { owner: true, warehouse: false, support: false, marketing: false, accountant: false },
      edit: { owner: true, warehouse: false, support: false, marketing: false, accountant: false },
      delete: { owner: true, warehouse: false, support: false, marketing: false, accountant: false },
    },
  };
}

// Đọc linh hoạt cấu trúc dữ liệu phân quyền từ backend seed hoặc lần lưu trước
export function normalizePermissionMatrix(rawSettings) {
  const base = createDefaultPermissionMatrix();
  if (!rawSettings || typeof rawSettings !== 'object') return base;

  const candidate = rawSettings.matrix && typeof rawSettings.matrix === 'object' ? rawSettings.matrix : rawSettings;

  const roleAliasMap = {
    owner: 'owner',
    'chủ sở hữu': 'owner',
    'chủ sở hữu (owner)': 'owner',
    warehouse: 'warehouse',
    'quản lý kho': 'warehouse',
    support: 'support',
    cskh: 'support',
    marketing: 'marketing',
    'tiếp thị': 'marketing',
    accountant: 'accountant',
    'kế toán': 'accountant',
  };

  // Trường hợp 0: Dạng rút gọn từ backend fallback (products_view, products_manage, finance_refund...)
  if (rawSettings.version !== 2) {
    for (const [k, roleFlags] of Object.entries(candidate)) {
      if (!k.includes('_') || !roleFlags || typeof roleFlags !== 'object') continue;
      const [modPart, actPart] = k.split('_');
      if (!base[modPart]) continue;
      const targetActions =
        actPart === 'view'
          ? ['view']
          : actPart === 'manage' || actPart === 'refund'
            ? ['create', 'edit', 'delete']
            : PERMISSION_ACTIONS.some((a) => a.id === actPart)
              ? [actPart]
              : [];
      for (const [rk, rv] of Object.entries(roleFlags)) {
        const normRole = roleAliasMap[rk.toLowerCase()];
        if (normRole && typeof rv === 'boolean') {
          for (const aId of targetActions) {
            base[modPart][aId][normRole] = rv;
          }
        }
      }
    }
  }

  // Trường hợp 1: Chuẩn canonical matrix[resourceId][actionId][roleId]
  for (const res of PERMISSION_RESOURCES) {
    const resObj = candidate[res.id];
    if (resObj && typeof resObj === 'object') {
      for (const act of PERMISSION_ACTIONS) {
        if (resObj[act.id] && typeof resObj[act.id] === 'object') {
          for (const [rk, rv] of Object.entries(resObj[act.id])) {
            const normRole = roleAliasMap[rk.toLowerCase()];
            if (normRole && typeof rv === 'boolean') {
              base[res.id][act.id][normRole] = rv;
            }
          }
        }
      }
      // Trường hợp 2: matrix[resourceId][roleId] = ['view', 'edit'] hoặc { view: true }
      for (const [rk, rv] of Object.entries(resObj)) {
        const normRole = roleAliasMap[rk.toLowerCase()];
        if (!normRole) continue;
        if (Array.isArray(rv)) {
          for (const act of PERMISSION_ACTIONS) {
            base[res.id][act.id][normRole] = rv.includes(act.id);
          }
        } else if (rv && typeof rv === 'object') {
          for (const act of PERMISSION_ACTIONS) {
            if (typeof rv[act.id] === 'boolean') {
              base[res.id][act.id][normRole] = rv[act.id];
            }
          }
        }
      }
    }
  }

  // Trường hợp 3: matrix[roleKey][resourceId] = ['view', ...] hoặc { view: true, ... } hoặc 'products.view': true
  for (const [rk, roleData] of Object.entries(candidate)) {
    const normRole = roleAliasMap[rk.toLowerCase()];
    if (!normRole || !roleData || typeof roleData !== 'object') continue;
    for (const [pk, pv] of Object.entries(roleData)) {
      if (pk.includes('.')) {
        const [rId, aId] = pk.split('.');
        if (base[rId] && base[rId][aId] && typeof pv === 'boolean') {
          base[rId][aId][normRole] = pv;
        }
      } else if (base[pk]) {
        if (Array.isArray(pv)) {
          for (const act of PERMISSION_ACTIONS) {
            base[pk][act.id][normRole] = pv.includes(act.id);
          }
        } else if (pv && typeof pv === 'object') {
          for (const act of PERMISSION_ACTIONS) {
            if (typeof pv[act.id] === 'boolean') {
              base[pk][act.id][normRole] = pv[act.id];
            }
          }
        }
      }
    }
  }

  return base;
}

// ==========================================
// NHÓM 3: CẤU HÌNH STOREFRONT (/commerce/store)
// ==========================================
export const STOREFRONT_UI_STYLES = [
  { id: 'veylix', label: '🏛️ Veylix Kem Ấm (Mặc định)', desc: 'Bo góc mềm mại 18px, bóng đổ mịn sang trọng' },
  { id: 'glass', label: '✨ Thủy Tinh Mờ (Glass)', desc: 'Hiệu ứng kính mờ ấm áp, chiều sâu tinh tế' },
  { id: 'liquid-glass', label: '💧 Kính Lỏng Hiện Đại (Liquid Glass)', desc: 'Bề mặt trong trẻo, bo tròn 22px mượt mà' },
  { id: 'flat', label: '□ Tối Giản Tinh Khôi (Flat)', desc: 'Phẳng thoáng đãng, tập trung trọn vẹn sản phẩm' },
];

const VALID_SF_STYLES = new Set(STOREFRONT_UI_STYLES.map((s) => s.id));

export const STOREFRONT_COLOR_THEMES = [
  { id: 'veylix', label: '🏛️ Vàng Hổ Phách Veylix (Mặc định)', swatch: '#b87d14' },
  { id: 'xanh-rung', label: '🌿 Xanh Rừng Tự Nhiên', swatch: '#1f5f43' },
  { id: 'xanh-duong', label: '🌊 Xanh Đại Dương Dịu Mát', swatch: '#2563eb' },
  { id: 'hong', label: '🌸 Hồng Hoa Trà Tinh Tế', swatch: '#db2777' },
  { id: 'tim', label: '👑 Tím Oải Hương Thanh Lịch', swatch: '#7c3aed' },
  { id: 'cam', label: '🔥 Cam Hoàng Hôn Ấm Áp', swatch: '#ea580c' },
];

const VALID_SF_THEMES = new Set(STOREFRONT_COLOR_THEMES.map((t) => t.id));

export const STOREFRONT_DEFAULTS = {
  announcementEnabled: true,
  announcementText: 'Miễn phí vận chuyển toàn quốc cho đơn từ $50 · Nhập mã HELLO10 giảm ngay 10%',
  announcementLink: '/store/deals',
  heroBadge: 'BỘ SƯU TẬP MỚI 2026',
  heroTitle: 'Thiết kế tối giản cho nhịp sống hiện đại',
  heroSubtitle:
    'Khám phá các sản phẩm thời trang, balo và phụ kiện không gian sống được chế tác tỉ mỉ từ chất liệu bền vững của Veylix Studio.',
  heroCtaText: 'Mua sắm ngay',
  heroCtaLink: '/store/products',
  accentColor: '#b87d14',
  defaultUiStyle: 'veylix',
  defaultColorTheme: 'veylix',
  defaultColorMode: 'light',
  featuredLimit: 8,
  showCategoriesSection: true,
  showCouponsSection: true,
  showReviewsSection: true,
  enableLiveChat: true,
};

export function normalizeStorefrontConfig(raw = {}) {
  const rawStyle = raw.defaultUiStyle || raw.uiStyle || '';
  const rawTheme = raw.defaultColorTheme || raw.colorTheme || '';
  return {
    announcementEnabled: raw.announcementEnabled ?? raw.showAnnouncement ?? STOREFRONT_DEFAULTS.announcementEnabled,
    announcementText:
      raw.announcementText || raw.announcement || raw.announcementBar || STOREFRONT_DEFAULTS.announcementText,
    announcementLink: raw.announcementLink || STOREFRONT_DEFAULTS.announcementLink,
    heroBadge: raw.heroBadge || raw.badgeText || STOREFRONT_DEFAULTS.heroBadge,
    heroTitle: raw.heroTitle || raw.bannerTitle || STOREFRONT_DEFAULTS.heroTitle,
    heroSubtitle: raw.heroSubtitle || raw.bannerSubtitle || STOREFRONT_DEFAULTS.heroSubtitle,
    heroCtaText: raw.heroCtaText || raw.primaryCtaText || raw.ctaText || STOREFRONT_DEFAULTS.heroCtaText,
    heroCtaLink: raw.heroCtaLink || raw.ctaLink || STOREFRONT_DEFAULTS.heroCtaLink,
    accentColor: raw.accentColor || raw.primaryColor || STOREFRONT_DEFAULTS.accentColor,
    defaultUiStyle: VALID_SF_STYLES.has(rawStyle) ? rawStyle : 'veylix',
    defaultColorTheme: VALID_SF_THEMES.has(rawTheme) ? rawTheme : 'veylix',
    defaultColorMode: raw.defaultColorMode === 'dark' || raw.colorMode === 'dark' ? 'dark' : 'light',
    featuredLimit: Number(raw.featuredLimit ?? raw.featuredCount ?? raw.featuredProductsCount ?? STOREFRONT_DEFAULTS.featuredLimit) || 8,
    showCategoriesSection: raw.showCategoriesSection ?? true,
    showCouponsSection: raw.showCouponsSection ?? true,
    showReviewsSection: raw.showReviewsSection ?? true,
    enableLiveChat: raw.enableLiveChat ?? true,
  };
}

// ==========================================
// NHÓM 4: METADATA CHO 9 TRANG BÁO CÁO CHUYÊN SÂU
// ==========================================
export const REPORT_METADATA = {
  'report-orders': {
    reportType: 'orders',
    subtitle: 'Phân tích lưu lượng đơn hàng, tỷ lệ hoàn tất giao nhận, giá trị trung bình (AOV) và tốc độ xử lý.',
    chartTitle: 'Phân bổ tỷ trọng đơn hàng theo trạng thái & kênh',
    tableTitle: 'Bảng phân tích hiệu suất xử lý đơn hàng',
    colHeaders: ['Nhóm trạng thái / Kênh', 'Số lượng đơn', 'Giá trị đơn ($)', 'AOV trung bình', 'Đánh giá', 'Tỷ trọng'],
    kpiLabels: ['Tổng doanh thu đơn', 'Tổng đơn ghi nhận', 'Giá trị đơn TB (AOV)', 'Tỷ lệ hoàn tất'],
  },
  'report-products': {
    reportType: 'products',
    subtitle: 'Đo lường sức mua từng SKU, doanh thu đóng góp, điểm đánh giá khách hàng và hiệu suất danh mục.',
    chartTitle: 'Top sản phẩm đóng góp doanh thu cao nhất',
    tableTitle: 'Bảng xếp hạng hiệu suất kinh doanh theo sản phẩm',
    colHeaders: ['Sản phẩm / Danh mục', 'Số lượng đã bán', 'Doanh thu thuần', 'Tồn kho hiện tại', 'Xu hướng', 'Tỷ trọng doanh thu'],
    kpiLabels: ['Doanh thu danh mục', 'Đơn vị SP bán ra', 'Giá bán bình quân', 'Biên lợi nhuận gộp'],
  },
  'report-inventory': {
    reportType: 'inventory',
    subtitle: 'Theo dõi giá trị vốn tồn kho theo khu vực NY / CA / TX, vòng quay hàng tồn và cảnh báo điểm đặt hàng lại.',
    chartTitle: 'Cơ cấu tồn kho khả dụng theo nhóm hàng & kho',
    tableTitle: 'Chi tiết định giá & sức khỏe tồn kho',
    colHeaders: ['Nhóm kho / Mặt hàng', 'Tồn thực tế (On-hand)', 'Giá trị vốn tồn', 'Khả dụng bán ngay', 'Tình trạng', 'Mức lấp đầy'],
    kpiLabels: ['Tổng giá trị tồn kho', 'Tổng đơn vị tồn', 'Giá vốn trung bình', 'Tỷ lệ sẵn hàng'],
  },
  'report-customers': {
    reportType: 'customers',
    subtitle: 'Phân tích giá trị vòng đời khách hàng (CLV), tỷ lệ mua lặp lại và mức chi tiêu giữa các phân khúc.',
    chartTitle: 'Đóng góp chi tiêu theo phân khúc khách hàng',
    tableTitle: 'Phân tích hành vi & chi tiêu nhóm khách hàng',
    colHeaders: ['Phân khúc / Khách hàng', 'Số đơn tích lũy', 'Tổng chi tiêu ($)', 'Chi tiêu TB / đơn', 'Mức gắn kết', 'Tỷ trọng đóng góp'],
    kpiLabels: ['Doanh thu từ KH', 'Tổng lượt đặt mua', 'CLV trung bình', 'Tỷ lệ quay lại'],
  },
  'report-returns': {
    reportType: 'returns',
    subtitle: 'Giám sát tỷ lệ hoàn trả hàng, nguyên nhân đổi trả phổ biến và giá trị hoàn tiền theo dòng sản phẩm.',
    chartTitle: 'Tỷ lệ nguyên nhân đổi trả & hoàn tiền',
    tableTitle: 'Bảng thống kê chi tiết yêu cầu trả hàng & hoàn tiền',
    colHeaders: ['Lý do / Nhóm sản phẩm', 'Số ca phát sinh', 'Giá trị hoàn ($)', 'Thời gian xử lý', 'Mức rủi ro', 'Tỷ trọng ca hoàn'],
    kpiLabels: ['Tổng giá trị đối soát', 'Đơn phát sinh xử lý', 'Giá trị hoàn TB', 'Tỷ lệ giữ chân đổi size'],
  },
  'report-channels': {
    reportType: 'channels',
    subtitle: 'So sánh tốc độ tăng trưởng, chi phí chuyển đổi và biên lợi nhuận giữa Website, Mobile App, Sàn và Social.',
    chartTitle: 'So sánh doanh thu giữa các kênh bán hàng đa kênh',
    tableTitle: 'Chi tiết hiệu quả kinh doanh đa kênh (Omnichannel)',
    colHeaders: ['Kênh phân phối', 'Đơn hàng thành công', 'Doanh thu GMV', 'Giá trị TB (AOV)', 'Tăng trưởng', 'Thị phần kênh'],
    kpiLabels: ['Tổng GMV đa kênh', 'Tổng đơn toàn kênh', 'AOV bình quân', 'Biên lợi nhuận ròng'],
  },
  'report-payments': {
    reportType: 'payments',
    subtitle: 'Đối soát dòng tiền thực nhận (Net), phí cổng thanh toán (Stripe, VNPay, MoMo, COD) và tỷ lệ giao dịch thành công.',
    chartTitle: 'Lưu lượng thanh toán theo cổng giao dịch',
    tableTitle: 'Bảng đối soát giao dịch & phí xử lý thanh toán',
    colHeaders: ['Cổng thanh toán', 'Số giao dịch', 'Tổng thu gộp (Gross)', 'Thực nhận (Net)', 'Trạng thái đối soát', 'Tỷ trọng dòng tiền'],
    kpiLabels: ['Tổng thu qua cổng', 'Giao dịch thành công', 'Giá trị GD trung bình', 'Tỷ lệ thanh toán mượt'],
  },
  'report-vendors': {
    reportType: 'vendors',
    subtitle: 'Đánh giá doanh số đối tác trên Sàn TMĐT, doanh thu hoa hồng thu về và công nợ chờ quyết toán.',
    chartTitle: 'Xếp hạng doanh số các gian hàng đối tác (Vendors)',
    tableTitle: 'Bảng tổng hợp doanh số & hoa hồng đối tác sàn',
    colHeaders: ['Gian hàng đối tác', 'Số SP đang bán', 'Doanh số GMV', 'Hoa hồng sàn thu', 'Hạng đối tác', 'Tỷ trọng GMV sàn'],
    kpiLabels: ['Tổng GMV đối tác', 'Số lượng SP đối tác', 'Doanh số TB / Vendor', 'Tỷ lệ hoa hồng TB'],
  },
  'report-marketing': {
    reportType: 'marketing',
    subtitle: 'Đo lường hiệu quả sử dụng Mã giảm giá, ROAS chiến dịch quảng cáo và doanh thu mang lại từ ưu đãi.',
    chartTitle: 'Hiệu quả chuyển đổi của các chiến dịch & mã ưu đãi',
    tableTitle: 'Bảng phân tích lượt dùng Voucher & chiến dịch tiếp thị',
    colHeaders: ['Chiến dịch / Mã Coupon', 'Lượt kích hoạt', 'Doanh thu mang lại', 'Mức ưu đãi', 'Trạng thái', 'Tỷ lệ sử dụng hạn mức'],
    kpiLabels: ['Doanh thu từ chiến dịch', 'Đơn áp dụng ưu đãi', 'AOV đơn có mã giảm', 'Hiệu suất chuyển đổi'],
  },
};

// ==========================================
// NHÓM 6: METADATA CHO 43+ PHÂN HỆ DANH SÁCH NGHIỆP VỤ
// ==========================================
export const RESOURCE_DOMAIN_META = {
  variants: {
    subtitle: 'Quản lý các tổ hợp Kích cỡ (S/M/L/XL), Màu sắc và Chất liệu gắn với SKU sản phẩm.',
    primaryCol: 'Biến thể sản phẩm',
    categoryCol: 'Nhóm tùy chọn',
    countCol: 'Tồn biến thể',
    valueCol: 'Giá niêm yết',
    defaultCategory: 'Kích cỡ & Màu sắc',
  },
  attributes: {
    subtitle: 'Định nghĩa các thuộc tính kỹ thuật dùng chung để lọc sản phẩm trên Storefront.',
    primaryCol: 'Tên thuộc tính',
    categoryCol: 'Kiểu hiển thị',
    countCol: 'Số giá trị',
    valueCol: 'SP áp dụng',
    defaultCategory: 'Bộ lọc danh mục',
  },
  collections: {
    subtitle: 'Nhóm các sản phẩm theo mùa vụ hoặc chủ đề phong cách để trưng bày nổi bật trên cửa hàng.',
    primaryCol: 'Tên bộ sưu tập',
    categoryCol: 'Chủ đề mùa vụ',
    countCol: 'Số sản phẩm',
    valueCol: 'Doanh thu nhóm',
    defaultCategory: 'Bộ sưu tập chủ đề',
  },
  tags: {
    subtitle: 'Quản lý hệ thống nhãn từ khóa giúp tìm kiếm nhanh và phân nhóm khuyến mãi tự động.',
    primaryCol: 'Nhãn (Tag)',
    categoryCol: 'Nhóm phân loại',
    countCol: 'SP gắn nhãn',
    valueCol: 'Lượt tìm kiếm',
    defaultCategory: 'Nhãn tiếp thị',
  },
  deliveries: {
    subtitle: 'Giám sát hành trình bưu kiện theo thời gian thực từ lúc rời kho đến tay khách nhận.',
    primaryCol: 'Chuyến giao / Tuyến đường',
    categoryCol: 'Đơn vị giao vận',
    countCol: 'Số kiện hàng',
    valueCol: 'Giá trị thu hộ',
    defaultCategory: 'Tuyến nội thành',
  },
  carriers: {
    subtitle: 'Danh sách đối tác vận chuyển kết nối API tự động lấy mã vận đơn và tính cước phí.',
    primaryCol: 'Đơn vị vận chuyển',
    categoryCol: 'Loại dịch vụ',
    countCol: 'Đơn đang giao',
    valueCol: 'Cước trung bình',
    defaultCategory: 'Giao nhanh toàn quốc',
  },
  returns: {
    subtitle: 'Tiếp nhận, kiểm tra tình trạng hàng hoàn và phê duyệt đổi size hoặc nhập lại kho.',
    primaryCol: 'Phiếu yêu cầu trả hàng',
    categoryCol: 'Lý do đổi trả',
    countCol: 'Số SP hoàn',
    valueCol: 'Giá trị hoàn',
    defaultCategory: 'Đổi kích cỡ / màu',
  },
  refunds: {
    subtitle: 'Theo dõi các lệnh hoàn tiền về thẻ, ví điện tử hoặc tài khoản ngân hàng của người mua.',
    primaryCol: 'Lệnh hoàn tiền',
    categoryCol: 'Phương thức hoàn',
    countCol: 'Số sản phẩm',
    valueCol: 'Số tiền hoàn',
    defaultCategory: 'Hoàn qua cổng thanh toán',
  },
  cancellations: {
    subtitle: 'Lưu trữ hồ sơ các đơn hàng đã hủy, lý do hủy và trạng thái hoàn trả tồn kho.',
    primaryCol: 'Đơn hàng đã hủy',
    categoryCol: 'Nguyên nhân hủy',
    countCol: 'Số món hàng',
    valueCol: 'Giá trị đơn hủy',
    defaultCategory: 'Khách đổi ý / đặt lại',
  },
  abandoned: {
    subtitle: 'Danh sách các giỏ hàng khách đã thêm sản phẩm nhưng chưa hoàn tất bước thanh toán.',
    primaryCol: 'Giỏ hàng bỏ quên',
    categoryCol: 'Kênh phát sinh',
    countCol: 'Số SP trong giỏ',
    valueCol: 'Giá trị tiềm năng',
    defaultCategory: 'Cửa hàng trực tuyến',
  },
  warehouses: {
    subtitle: 'Quản lý mạng lưới kho trung tâm, điểm lưu trữ vùng miền, sức chứa và nhân sự phụ trách.',
    primaryCol: 'Tên kho hàng / Trung tâm',
    categoryCol: 'Khu vực địa lý',
    countCol: 'Tổng tồn đơn vị',
    valueCol: 'Giá trị hàng lưu kho',
    defaultCategory: 'Kho trung tâm vùng',
  },
  transfers: {
    subtitle: 'Điều phối phiếu luân chuyển hàng hóa cân bằng tồn kho giữa các chi nhánh.',
    primaryCol: 'Phiếu chuyển kho',
    categoryCol: 'Tuyến kho xuất → nhận',
    countCol: 'Số lượng SKU',
    valueCol: 'Giá trị lô hàng',
    defaultCategory: 'Luân chuyển nội bộ',
  },
  replenishment: {
    subtitle: 'Kế hoạch đặt hàng bổ sung (PO) cho các mặt hàng bán chạy sắp chạm điểm đặt hàng lại.',
    primaryCol: 'Đề xuất nhập hàng',
    categoryCol: 'Mức độ ưu tiên',
    countCol: 'SL cần nhập',
    valueCol: 'Dự toán chi phí',
    defaultCategory: 'Bổ sung định kỳ',
  },
  adjustments: {
    subtitle: 'Biên bản kiểm kê thực tế và điều chỉnh chênh lệch tồn kho định kỳ.',
    primaryCol: 'Phiếu kiểm kê kho',
    categoryCol: 'Loại điều chỉnh',
    countCol: 'SL chênh lệch',
    valueCol: 'Giá trị điều chỉnh',
    defaultCategory: 'Kiểm kê định kỳ',
  },
  suppliers: {
    subtitle: 'Hồ sơ nhà máy gia công, nhà cung cấp nguyên vật liệu và thời gian giao hàng chuẩn (Lead time).',
    primaryCol: 'Nhà cung cấp / Xưởng',
    categoryCol: 'Ngành hàng cung ứng',
    countCol: 'Số SKU cung cấp',
    valueCol: 'Kim ngạch nhập',
    defaultCategory: 'Đối tác sản xuất',
  },
  discounts: {
    subtitle: 'Quy tắc giảm giá tự động áp dụng ngay trong giỏ hàng khi mua theo combo hoặc đạt số lượng.',
    primaryCol: 'Quy tắc giảm tự động',
    categoryCol: 'Điều kiện kích hoạt',
    countCol: 'Lượt áp dụng',
    valueCol: 'Doanh thu tạo ra',
    defaultCategory: 'Mua nhiều giảm sâu',
  },
  promotions: {
    subtitle: 'Quản lý các chương trình Flash Sale, ưu đãi ngày đôi và sự kiện tri ân thành viên.',
    primaryCol: 'Chương trình khuyến mãi',
    categoryCol: 'Loại sự kiện',
    countCol: 'SP tham gia',
    valueCol: 'Doanh số sự kiện',
    defaultCategory: 'Flash Sale theo khung giờ',
  },
  'gift-cards': {
    subtitle: 'Phát hành thẻ quà tặng điện tử (e-Gift Card) có mệnh giá và theo dõi số dư khả dụng.',
    primaryCol: 'Thẻ quà tặng',
    categoryCol: 'Hạng mệnh giá',
    countCol: 'Lượt sử dụng',
    valueCol: 'Số dư còn lại',
    defaultCategory: 'Quà tặng doanh nghiệp',
  },
  campaigns: {
    subtitle: 'Theo dõi ngân sách, thông điệp và hiệu quả chuyển đổi của các chiến dịch bán hàng đa kênh.',
    primaryCol: 'Chiến dịch bán hàng',
    categoryCol: 'Kênh triển khai',
    countCol: 'Đơn chuyển đổi',
    valueCol: 'Doanh thu chiến dịch',
    defaultCategory: 'Đa kênh Omnichannel',
  },
  vendors: {
    subtitle: 'Danh bạ chi tiết các gian hàng đối tác đang kinh doanh trên Veylix Marketplace.',
    primaryCol: 'Gian hàng đối tác',
    categoryCol: 'Ngành hàng chính',
    countCol: 'Số SP niêm yết',
    valueCol: 'Doanh số tháng',
    defaultCategory: 'Gian hàng chính hãng',
  },
  applications: {
    subtitle: 'Thẩm định hồ sơ pháp lý và danh mục sản phẩm của các nhà bán hàng đăng ký mở gian hàng mới.',
    primaryCol: 'Hồ sơ đăng ký bán hàng',
    categoryCol: 'Loại hình pháp nhân',
    countCol: 'SP dự kiến đăng',
    valueCol: 'Quy mô cam kết',
    defaultCategory: 'Doanh nghiệp / Thương hiệu',
  },
  approvals: {
    subtitle: 'Kiểm duyệt chất lượng hình ảnh, mô tả và mức giá sản phẩm do đối tác gửi lên sàn.',
    primaryCol: 'Sản phẩm chờ duyệt',
    categoryCol: 'Gian hàng gửi duyệt',
    countCol: 'Số biến thể',
    valueCol: 'Giá đề xuất',
    defaultCategory: 'Kiểm duyệt tiêu chuẩn',
  },
  'vendor-orders': {
    subtitle: 'Tách đơn hàng con theo từng nhà bán để theo dõi SLA đóng gói và bàn giao vận chuyển.',
    primaryCol: 'Đơn hàng đối tác',
    categoryCol: 'Gian hàng xử lý',
    countCol: 'Số kiện hàng',
    valueCol: 'Giá trị thanh toán',
    defaultCategory: 'Đơn sàn TMĐT',
  },
  payouts: {
    subtitle: 'Lịch sử lệnh chuyển khoản quyết toán doanh thu sau khấu trừ hoa hồng cho đối tác.',
    primaryCol: 'Kỳ quyết toán đối tác',
    categoryCol: 'Ngân hàng thụ hưởng',
    countCol: 'Số đơn đối soát',
    valueCol: 'Thực chi ròng',
    defaultCategory: 'Đối soát định kỳ',
  },
  disputes: {
    subtitle: 'Phân xử minh bạch các khiếu nại giữa người mua và gian hàng đối tác trên sàn.',
    primaryCol: 'Hồ sơ tranh chấp',
    categoryCol: 'Vấn đề khiếu nại',
    countCol: 'Bằng chứng đính kèm',
    valueCol: 'Giá trị tranh chấp',
    defaultCategory: 'Chất lượng / Giao nhận',
  },
  menus: {
    subtitle: 'Cấu trúc thanh điều hướng Header, Mega Menu và các cột liên kết Footer trên Storefront.',
    primaryCol: 'Menu điều hướng',
    categoryCol: 'Vị trí hiển thị',
    countCol: 'Số mục liên kết',
    valueCol: 'Tỷ lệ nhấp (CTR)',
    defaultCategory: 'Thanh điều hướng chính',
  },
  pages: {
    subtitle: 'Quản trị các trang nội dung tĩnh như Giới thiệu thương hiệu, Chính sách đổi trả và Bảo mật.',
    primaryCol: 'Tiêu đề trang nội dung',
    categoryCol: 'Nhóm thông tin',
    countCol: 'Lượt xem tháng',
    valueCol: 'Thời gian đọc TB',
    defaultCategory: 'Chính sách khách hàng',
  },
  blog: {
    subtitle: 'Xuất bản bài viết phong cách sống, hướng dẫn phối đồ và câu chuyện chế tác thu hút lưu lượng tự nhiên.',
    primaryCol: 'Tiêu đề bài viết Blog',
    categoryCol: 'Chuyên mục',
    countCol: 'Lượt đọc',
    valueCol: 'Đơn hàng dẫn nguồn',
    defaultCategory: 'Phong cách sống tối giản',
  },
  testimonials: {
    subtitle: 'Tuyển chọn các nhận xét tiêu biểu của khách hàng để hiển thị uy tín trên Trang chủ /store.',
    primaryCol: 'Khách hàng & Nhận xét',
    categoryCol: 'Sản phẩm trải nghiệm',
    countCol: 'Điểm đánh giá (Sao)',
    valueCol: 'Độ tin cậy',
    defaultCategory: 'Khách hàng xác thực',
  },
  contacts: {
    subtitle: 'Hộp thư tiếp nhận câu hỏi hợp tác, đặt hàng doanh nghiệp (B2B) và góp ý từ trang Hỗ trợ /store/support.',
    primaryCol: 'Người gửi & Chủ đề liên hệ',
    categoryCol: 'Phân loại yêu cầu',
    countCol: 'Phản hồi',
    valueCol: 'Giá trị B2B ước tính',
    defaultCategory: 'Liên hệ từ Storefront',
  },
  popups: {
    subtitle: 'Thiết lập hộp thoại chào mừng tặng mã giảm giá và banner thông báo sự kiện trên cửa hàng.',
    primaryCol: 'Chiến dịch Popup / Banner',
    categoryCol: 'Điều kiện hiển thị',
    countCol: 'Lượt thu thập Lead',
    valueCol: 'Tỷ lệ chuyển đổi',
    defaultCategory: 'Ưu đãi khách mới',
  },
  faqs: {
    subtitle: 'Thư viện câu hỏi thường gặp đồng bộ trực tiếp sang trang Hỗ trợ khách hàng (/store/support) và AI CSKH.',
    primaryCol: 'Câu hỏi thường gặp (FAQ)',
    categoryCol: 'Chủ đề hỗ trợ',
    countCol: 'Lượt đánh giá hữu ích',
    valueCol: 'Thứ tự ưu tiên',
    defaultCategory: 'Giao hàng & Đổi trả',
  },
  providers: {
    subtitle: 'Quản lý kết nối kỹ thuật, khóa API và trạng thái hoạt động của các cổng thanh toán điện tử.',
    primaryCol: 'Cổng thanh toán',
    categoryCol: 'Loại kết nối',
    countCol: 'GD trong tháng',
    valueCol: 'Biểu phí giao dịch',
    defaultCategory: 'Cổng thanh toán trực tuyến',
  },
  settlements: {
    subtitle: 'Biên bản đối soát tiền về tài khoản ngân hàng doanh nghiệp từ Stripe, VNPay, MoMo và COD.',
    primaryCol: 'Lô quyết toán ngân hàng',
    categoryCol: 'Đơn vị thanh toán',
    countCol: 'Số giao dịch gộp',
    valueCol: 'Tổng tiền về TK',
    defaultCategory: 'Đối soát T+1',
  },
  'payment-links': {
    subtitle: 'Tạo liên kết thanh toán nhanh gửi qua Chat / Zalo / Email để khách chốt đơn trong 1 chạm.',
    primaryCol: 'Link thanh toán nhanh',
    categoryCol: 'Kênh gửi khách',
    countCol: 'Lượt thanh toán',
    valueCol: 'Số tiền thu',
    defaultCategory: 'Chốt đơn qua CSKH',
  },
  tickets: {
    subtitle: 'Hệ thống phiếu hỗ trợ kỹ thuật và chăm sóc sau bán hàng theo mức độ ưu tiên SLA.',
    primaryCol: 'Phiếu hỗ trợ (Ticket)',
    categoryCol: 'Nhóm vấn đề',
    countCol: 'Trao đổi',
    valueCol: 'Đơn liên quan',
    defaultCategory: 'Hỗ trợ đơn hàng',
  },
  email: {
    subtitle: 'Quản lý các chiến dịch gửi bản tin Email Marketing, thông báo bộ sưu tập mới và tỷ lệ mở thư.',
    primaryCol: 'Chiến dịch gửi Email',
    categoryCol: 'Tệp người nhận',
    countCol: 'Số thư đã gửi',
    valueCol: 'Doanh thu quy đổi',
    defaultCategory: 'Bản tin khách hàng',
  },
  'email-templates': {
    subtitle: 'Bộ mẫu thư giao dịch chuẩn thương hiệu (Xác nhận đơn, Đang giao hàng, Hoàn tiền, Chào mừng).',
    primaryCol: 'Tên mẫu tin nhắn / Email',
    categoryCol: 'Sự kiện kích hoạt',
    countCol: 'Lượt gửi tự động',
    valueCol: 'Tỷ lệ mở (Open Rate)',
    defaultCategory: 'Email giao dịch tự động',
  },
  notifications: {
    subtitle: 'Trung tâm lưu trữ toàn bộ cảnh báo vận hành, biến động kho và sự kiện đơn hàng theo thời gian thực.',
    primaryCol: 'Nội dung thông báo',
    categoryCol: 'Nhóm cảnh báo',
    countCol: 'Mức ưu tiên',
    valueCol: 'Phạm vi ảnh hưởng',
    defaultCategory: 'Cảnh báo vận hành',
  },
  media: {
    subtitle: 'Thư viện hình ảnh lookbook, ảnh sản phẩm chuẩn studio và video giới thiệu chất liệu.',
    primaryCol: 'Tài sản hình ảnh / Video',
    categoryCol: 'Bộ sưu tập / Định dạng',
    countCol: 'SP đang dùng',
    valueCol: 'Dung lượng tệp',
    defaultCategory: 'Ảnh sản phẩm PNG/WebP',
  },
  files: {
    subtitle: 'Lưu trữ bảng hướng dẫn chọn size (Size Guide), hồ sơ công bố chất lượng, hợp đồng và bảng giá PDF.',
    primaryCol: 'Tên tài liệu / Tệp tin',
    categoryCol: 'Loại chứng từ',
    countCol: 'Lượt tải xuống',
    valueCol: 'Kích thước tệp',
    defaultCategory: 'Tài liệu vận hành',
  },
  integrations: {
    subtitle: 'Quản lý kết nối ERP, phần mềm kế toán MISA/SAP, kho vận và khóa truy cập REST API đối tác.',
    primaryCol: 'Ứng dụng / Kết nối API',
    categoryCol: 'Nhóm tích hợp',
    countCol: 'Request / ngày',
    valueCol: 'Độ trễ trung bình',
    defaultCategory: 'Đồng bộ ERP & Kế toán',
  },
  webhooks: {
    subtitle: 'Đăng ký điểm cuối nhận sự kiện thời gian thực (`order.created`, `stock.updated`, `payment.succeeded`).',
    primaryCol: 'Endpoint Webhook',
    categoryCol: 'Sự kiện lắng nghe',
    countCol: 'Lần gửi thành công',
    valueCol: 'Tỷ lệ HTTP 200',
    defaultCategory: 'Sự kiện đơn hàng',
  },
  roles: {
    subtitle: 'Định nghĩa các nhóm vai trò quản trị, cấp bậc phê duyệt và phạm vi truy cập dữ liệu nội bộ.',
    primaryCol: 'Tên vai trò người dùng',
    categoryCol: 'Khối vận hành',
    countCol: 'Nhân sự đảm nhiệm',
    valueCol: 'Cấp thẩm quyền',
    defaultCategory: 'Quản trị nội bộ',
  },
  teams: {
    subtitle: 'Tổ chức các phòng ban chuyên môn (Kho vận, CSKH, Marketing, Kế toán) và chỉ tiêu SLA từng nhóm.',
    primaryCol: 'Tên đội nhóm / Phòng ban',
    categoryCol: 'Chức năng chính',
    countCol: 'Số thành viên',
    valueCol: 'Hiệu suất SLA',
    defaultCategory: 'Khối vận hành',
  },
  'ai-voice': {
    subtitle: 'Thiết lập hồ sơ giọng điệu thương hiệu (Brand Voice) cho từng tệp khách hàng và kênh giao tiếp.',
    primaryCol: 'Hồ sơ giọng nói & văn phong',
    categoryCol: 'Ngữ cảnh áp dụng',
    countCol: 'Mẫu câu chuẩn',
    valueCol: 'Độ nhất quán',
    defaultCategory: 'Giọng văn thương hiệu',
  },
  prompts: {
    subtitle: 'Kho lưu trữ câu lệnh mẫu (Prompt Templates) tối ưu sẵn cho mô tả SEO, quảng cáo và phản hồi CSKH.',
    primaryCol: 'Tên mẫu câu lệnh (Prompt)',
    categoryCol: 'Tác vụ AI',
    countCol: 'Lượt kích hoạt',
    valueCol: 'Điểm hiệu quả',
    defaultCategory: 'Biên tập nội dung SEO',
  },
  knowledge: {
    subtitle: 'Tài liệu chính sách đổi trả, hướng dẫn bảo quản và bảng size dùng làm nguồn tri thức chuẩn cho AI.',
    primaryCol: 'Nguồn tài liệu tri thức',
    categoryCol: 'Chủ đề huấn luyện',
    countCol: 'Số đoạn (Chunks)',
    valueCol: 'Độ phủ câu trả lời',
    defaultCategory: 'Chính sách cửa hàng',
  },
  automations: {
    subtitle: 'Quy tắc tự động phân loại ý định tin nhắn khách hàng và gợi ý phản hồi tức thì dưới 3 giây.',
    primaryCol: 'Quy tắc phản hồi tự động',
    categoryCol: 'Từ khóa / Ý định',
    countCol: 'Hội thoại xử lý',
    valueCol: 'Thời gian phản hồi',
    defaultCategory: 'Tự động hóa CSKH',
  },
  'ai-history': {
    subtitle: 'Nhật ký toàn bộ các bản thảo do AI Studio khởi tạo, dung lượng ký tự và mức sử dụng hạn mức.',
    primaryCol: 'Bản thảo nội dung AI',
    categoryCol: 'Loại tác vụ',
    countCol: 'Độ dài (ký tự)',
    valueCol: 'Nhóm nội dung',
    defaultCategory: 'AI Studio',
  },
};

export function buildContextualFallbackRecords(slug, title) {
  const meta = RESOURCE_DOMAIN_META[slug];
  const prefix = `VX-${String(slug || 'MOD').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`;
  const cat = meta?.defaultCategory || 'Nghiệp vụ vận hành';

  const presets = {
    warehouses: [
      { name: 'Kho Trung Tâm TP. Hồ Chí Minh (Quận 7)', code: 'WH-SGN-01', category: 'Miền Nam', subtitle: ' Trung tâm hoàn tất đơn hàng tự động 24/7', owner: 'Trần Quốc Bảo', count: 1480, value: '$64,200', status: 'Hoạt động', statusClass: 'green', date: 'Hôm nay', notes: 'Đạt 78% công suất lưu trữ, kết nối trực tiếp GHTK & DHL.' },
      { name: 'Kho Phân Phối Miền Bắc (Long Biên, Hà Nội)', code: 'WH-HAN-02', category: 'Miền Bắc', subtitle: 'Phục vụ giao nhanh 2H nội thành Hà Nội', owner: 'Nguyễn Hoàng Nam', count: 920, value: '$39,500', status: 'Hoạt động', statusClass: 'green', date: 'Hôm qua', notes: 'Đang tiếp nhận lô áo khoác Linen thu đông.' },
      { name: 'Kho Trung Chuyển Miền Trung (Hải Châu, Đà Nẵng)', code: 'WH-DAD-03', category: 'Miền Trung', subtitle: 'Điểm điều phối khu vực miền Trung & Tây Nguyên', owner: 'Lê Thanh Thảo', count: 410, value: '$17,800', status: 'Đang xử lý', statusClass: 'amber', date: '28 Thg 4', notes: 'Đang kiểm kê định kỳ quý II.' },
    ],
    carriers: [
      { name: 'Giao Hàng Tiết Kiệm (GHTK Express)', code: 'CAR-GHTK', category: 'Nội địa toàn quốc', subtitle: 'API đồng bộ trạng thái tự động mỗi 15 phút', owner: 'Hệ thống Logistics', count: 642, value: '$4.50', status: 'Hoạt động', statusClass: 'green', date: 'Hôm nay', notes: 'Tỷ lệ giao thành công lần đầu đạt 97.4%.' },
      { name: 'Giao Hàng Nhanh (GHN Pro)', code: 'CAR-GHN', category: 'Giao nhanh liên tỉnh', subtitle: 'Ưu tiên tuyến TP.HCM - Hà Nội - Đà Nẵng', owner: 'Hệ thống Logistics', count: 318, value: '$5.20', status: 'Hoạt động', statusClass: 'green', date: 'Hôm nay', notes: 'Miễn phí thu hộ COD dưới $200.' },
      { name: 'DHL Express International', code: 'CAR-DHL', category: 'Vận chuyển quốc tế & Hỏa tốc', subtitle: 'Chuyển phát nhanh hàng không có bảo hiểm 100%', owner: 'Alex Chen', count: 94, value: '$15.00', status: 'Hoạt động', statusClass: 'green', date: 'Hôm qua', notes: 'Dành cho khách VIP và đơn hàng quốc tế.' },
    ],
    faqs: [
      { name: 'Thời gian giao hàng tiêu chuẩn của Veylix mất bao lâu?', code: 'FAQ-SHIP-01', category: 'Giao hàng & Vận chuyển', subtitle: 'Nội thành 1–2 ngày, liên tỉnh 2–4 ngày làm việc', owner: 'CSKH Veylix', count: 342, value: 'Ưu tiên #1', status: 'Hoạt động', statusClass: 'green', date: 'Hôm nay', notes: 'Miễn phí vận chuyển cho mọi đơn hàng từ $50 trở lên.' },
      { name: 'Chính sách đổi trả sản phẩm trong 30 ngày áp dụng thế nào?', code: 'FAQ-RET-02', category: 'Đổi trả & Hoàn tiền', subtitle: 'Đổi size miễn phí tại nhà cho sản phẩm còn nguyên tem mác', owner: 'CSKH Veylix', count: 289, value: 'Ưu tiên #2', status: 'Hoạt động', statusClass: 'green', date: 'Hôm qua', notes: 'Hoàn tiền trong 24–48 giờ sau khi kho nhận lại kiện hàng.' },
      { name: 'Tôi có thể kiểm tra tình trạng đơn hàng trực tuyến ở đâu?', code: 'FAQ-ORD-03', category: 'Tra cứu đơn hàng', subtitle: 'Nhập mã đơn #SFxxxxx tại mục Tra cứu đơn trên /store/orders', owner: 'CSKH Veylix', count: 215, value: 'Ưu tiên #3', status: 'Hoạt động', statusClass: 'green', date: '26 Thg 4', notes: 'Đồng bộ trực tiếp với mã vận đơn TRK-xxxxx.' },
    ],
  };

  if (presets[slug]) {
    return presets[slug].map((item, idx) => ({ id: `${slug}-fb-${idx + 1}`, moduleSlug: slug, ...item }));
  }

  return [
    {
      id: `${slug}-101`,
      moduleSlug: slug,
      name: `${title} — Tiêu chuẩn vận hành chính`,
      code: `${prefix}-101`,
      category: cat,
      subtitle: 'Đang áp dụng trên toàn hệ thống Veylix',
      owner: 'Alex Chen',
      date: 'Hôm nay',
      status: 'Hoạt động',
      statusClass: 'green',
      count: 128,
      value: '$1,450',
      notes: 'Đã xác thực đồng bộ dữ liệu thời gian thực.',
    },
    {
      id: `${slug}-102`,
      moduleSlug: slug,
      name: `${title} — Nhóm ưu tiên tăng trưởng`,
      code: `${prefix}-102`,
      category: cat,
      subtitle: 'Tối ưu cho khách hàng trực tuyến & di động',
      owner: 'Minh Anh',
      date: 'Hôm qua',
      status: 'Hoạt động',
      statusClass: 'green',
      count: 84,
      value: '$920',
      notes: 'Hiệu suất ổn định trong 30 ngày qua.',
    },
    {
      id: `${slug}-103`,
      moduleSlug: slug,
      name: `${title} — Đợt rà soát định kỳ`,
      code: `${prefix}-103`,
      category: cat,
      subtitle: 'Đang chờ bộ phận chuyên môn xác nhận',
      owner: 'Hoàng Nam',
      date: '28 Thg 4',
      status: 'Đang xử lý',
      statusClass: 'amber',
      count: 36,
      value: '$480',
      notes: 'Cần hoàn tất đối chiếu trước cuối tuần.',
    },
  ];
}
