import React, { useState, useMemo } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { SfIcon } from './StoreIcons';
import { useStore } from './StoreContext';
import { formatMoney, storeApi, FALLBACK_PRODUCT_IMAGE } from './storeApi';
import CartDrawer from './CartDrawer';
import QuickViewModal from './QuickViewModal';
import LiveChatWidget from './LiveChatWidget';
import ThemePersonalizerModal from './ThemePersonalizerModal';

export default function StorefrontLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    homeData,
    refreshHome,
    freeShippingThreshold,
    uiStyle,
    colorTheme,
    colorMode,
    setIsStylePanelOpen,
    cartCount,
    wishlist,
    customer,
    setIsCartOpen,
    toasts,
    showToast,
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterBusy, setNewsletterBusy] = useState(false);

  const settings = homeData.settings || {};
  const sfCfg = homeData.storefrontConfig?.settings || homeData.storefrontConfig || {};
  const maintCfg = homeData.maintenance?.settings || homeData.maintenance || {};
  const isMaintenance = maintCfg?.enabled === true;

  const showAnnouncement = sfCfg.announcementEnabled !== false && sfCfg.showAnnouncement !== false;
  const enableLiveChat = sfCfg.enableLiveChat !== false;

  const announcementText =
    sfCfg.announcementBar ||
    sfCfg.announcementText ||
    sfCfg.announcement ||
    sfCfg.bannerText ||
    `Miễn phí giao hàng cho đơn từ ${formatMoney(freeShippingThreshold)} · Đổi trả tận nơi miễn phí 30 ngày`;

  const quickSuggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return (homeData.featuredProducts || [])
      .filter(
        (p) =>
          String(p.name || '').toLowerCase().includes(q) ||
          String(p.category || '').toLowerCase().includes(q) ||
          String(p.sku || '').toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [searchTerm, homeData.featuredProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = searchTerm.trim();
    setSearchFocused(false);
    setMobileMenuOpen(false);
    navigate(clean ? `/store/products?search=${encodeURIComponent(clean)}` : '/store/products');
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || newsletterBusy) return;
    try {
      setNewsletterBusy(true);
      await storeApi.submitContactMessage({
        name: `Đăng ký Bản tin — ${email}`,
        subtitle: email,
        category: 'Bản tin ưu đãi',
        owner: email,
        status: 'Đã đăng ký',
        statusClass: 'green',
        count: 1,
        value: 'HELLO10',
        notes: `Khách hàng đăng ký nhận bản tin khuyến mãi từ chân trang Storefront (${email}).`,
      });
      setNewsletterEmail('');
      showToast('Đăng ký thành công! Bạn có thể dùng mã HELLO10 để giảm 10%.');
    } catch (err) {
      showToast(err.message || 'Không thể đăng ký lúc này', 'error');
    } finally {
      setNewsletterBusy(false);
    }
  };

  if (isMaintenance) {
    return (
      <div
        className="sf-root"
        data-sf-style={uiStyle}
        data-sf-theme={colorTheme}
        data-sf-mode={colorMode}
      >
        <div className="sf-maintenance">
          <div className="sf-maintenance-card">
            <span className="sf-announcement-pill" style={{ marginBottom: '16px', display: 'inline-block' }}>
              Đang bảo trì cửa hàng
            </span>
            <h1 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '12px' }}>
              {settings.storeName || 'Veylix Studio'} đang nâng cấp hệ thống
            </h1>
            <p style={{ color: 'var(--sf-text-muted)', marginBottom: '24px', lineHeight: 1.7 }}>
              {maintCfg.message ||
                maintCfg.maintenanceMessage ||
                'Chúng tôi đang cập nhật sản phẩm mới và tối ưu tốc độ mua sắm. Vui lòng quay lại sau ít phút nhé!'}
            </p>
            {(maintCfg.estimatedReturn || maintCfg.reopenAt) && (
              <div style={{ marginBottom: '22px', fontSize: '14px', color: 'var(--sf-primary)', fontWeight: 800 }}>
                Dự kiến mở lại lúc: {maintCfg.estimatedReturn || maintCfg.reopenAt}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button type="button" className="sf-btn sf-btn-primary" onClick={refreshHome}>
                <SfIcon name="refresh" size={16} />
                <span>Tải lại kiểm tra</span>
              </button>
              <Link to="/overview" className="sf-btn sf-btn-outline">
                <SfIcon name="grid" size={16} />
                <span>Về trang Quản trị (Admin)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: '/store', label: 'Trang chủ', end: true },
    { to: '/store/products', label: 'Sản phẩm' },
    { to: '/store/deals', label: 'Khuyến mãi' },
    { to: '/store/orders', label: 'Tra cứu đơn' },
    { to: '/store/support', label: 'Hỗ trợ & FAQ' },
  ];

  return (
    <div
      className="sf-root"
      data-sf-style={uiStyle}
      data-sf-theme={colorTheme}
      data-sf-mode={colorMode}
    >
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="sf-announcement">
          <div className="sf-announcement-inner">
            <div className="sf-announcement-copy">
              <span className="sf-announcement-pill">Ưu đãi</span>
              {sfCfg.announcementLink ? (
                <Link to={sfCfg.announcementLink} style={{ color: 'inherit' }}>
                  {announcementText}
                </Link>
              ) : (
                <span>{announcementText}</span>
              )}
            </div>
            <div className="sf-announcement-links">
              <Link to="/store/deals">Lấy mã giảm giá</Link>
              <span>·</span>
              <Link to="/store/orders">Kiểm tra đơn hàng</Link>
              <span>·</span>
              <span>Hotline: {settings.supportPhone || '+84 28 3822 1234'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Header */}
      <header className="sf-header">
        <div className="sf-header-inner">
          <button
            type="button"
            className="sf-icon-btn sf-mobile-toggle"
            aria-label="Mở menu điều hướng"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <SfIcon name={mobileMenuOpen ? 'close' : 'menu'} size={19} />
          </button>

          <Link to="/store" className="sf-logo">
            <span className="sf-logo-mark">
              <img src="/assets/images/veylix-mark.svg" alt="Veylix" />
            </span>
            <span className="sf-logo-text">
              <strong>{settings.storeName || 'Veylix Studio'}</strong>
              <small>{settings.tagline || 'Thương mại trong sự hài hòa'}</small>
            </span>
          </Link>

          <nav className="sf-nav" aria-label="Điều hướng cửa hàng">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sf-nav-link ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sf-search-box">
            <form className="sf-search-form" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                placeholder="Tìm món đồ bạn cần..."
                value={searchTerm}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm kiếm sản phẩm"
              />
              <button type="submit" className="sf-search-submit" aria-label="Tìm kiếm">
                <SfIcon name="search" size={14} />
              </button>
            </form>

            {searchFocused && quickSuggestions.length > 0 && (
              <div className="sf-search-dropdown">
                {quickSuggestions.map((p) => (
                  <button
                    key={p.id || p.sku}
                    type="button"
                    className="sf-search-item"
                    onMouseDown={() => {
                      setSearchFocused(false);
                      navigate(`/store/products/${encodeURIComponent(p.id || p.sku)}`);
                    }}
                  >
                    <img
                      src={p.image || FALLBACK_PRODUCT_IMAGE}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                    <div className="sf-search-item-info">
                      <strong>{p.name}</strong>
                      <small>{p.category} · {formatMoney(p.price)}</small>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sf-header-actions">
            <button
              type="button"
              className="sf-style-trigger"
              onClick={() => setIsStylePanelOpen(true)}
              title="Tùy chỉnh phong cách giao diện (Veylix Kem Ấm, Thủy Tinh, Kính Lỏng, Tối Giản), bảng màu & Sáng/Tối"
              aria-label="🎨 Giao diện"
            >
              <span>🎨</span>
              <span className="sf-style-label-text">Giao diện</span>
            </button>

            <Link
              to="/store/account?tab=wishlist"
              className="sf-icon-btn"
              title="Món đồ đã lưu Yêu thích"
              aria-label="Danh sách Yêu thích"
            >
              <SfIcon name="heart" size={18} filled={wishlist.length > 0} />
              {wishlist.length > 0 && <span className="sf-count-badge">{wishlist.length}</span>}
            </Link>

            <button
              type="button"
              className="sf-icon-btn"
              title="Mở Giỏ hàng của bạn"
              aria-label="Mở giỏ hàng"
              onClick={() => setIsCartOpen(true)}
            >
              <SfIcon name="bag" size={18} />
              {cartCount > 0 && <span className="sf-count-badge">{cartCount}</span>}
            </button>

            <Link
              to="/store/account"
              className="sf-icon-btn"
              title={customer ? `Tài khoản: ${customer.name}` : 'Đăng nhập / Tài khoản khách hàng'}
              aria-label="Tài khoản khách hàng"
              style={
                customer
                  ? { background: 'var(--sf-primary)', color: 'var(--sf-on-primary)', fontWeight: 900 }
                  : undefined
              }
            >
              {customer?.name ? (
                <span style={{ fontSize: '13px', fontWeight: 900 }}>
                  {customer.avatar || customer.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <SfIcon name="user" size={18} />
              )}
            </Link>

            <Link to="/overview" className="sf-admin-switch" title="Chuyển sang trang Quản trị viên">
              <SfIcon name="grid" size={16} />
              <span>Quản trị (Admin)</span>
            </Link>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '14px 20px 18px',
              borderTop: 'var(--sf-card-border)',
              background: 'var(--sf-surface)',
              display: 'grid',
              gap: '8px',
            }}
          >
            <form className="sf-search-form" onSubmit={handleSearchSubmit} style={{ marginBottom: '6px' }}>
              <input
                type="search"
                placeholder="Tìm món đồ bạn cần..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="sf-search-submit" aria-label="Tìm kiếm">
                <SfIcon name="search" size={14} />
              </button>
            </form>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '10px 12px',
                  fontWeight: 800,
                  background: location.pathname === item.to ? 'var(--sf-primary-soft)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className="sf-btn sf-btn-amber sf-btn-sm"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsStylePanelOpen(true);
              }}
            >
              🎨 Đổi Phong cách & Giao diện Sáng/Tối
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="sf-main">{children}</main>

      {/* Footer */}
      <footer className="sf-footer">
        <div className="sf-container">
          <div className="sf-footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span className="sf-logo-mark" style={{ width: '36px', height: '38px' }}>
                  <img src="/assets/images/veylix-mark.svg" alt="Veylix" />
                </span>
                <strong style={{ fontSize: '20px', color: '#fff', fontWeight: 900 }}>
                  {settings.storeName || 'Veylix Studio'}
                </strong>
              </div>
              <p style={{ fontSize: '13.5px', color: '#d4d4d8', marginBottom: '14px' }}>
                Mua sắm trực tuyến rõ ràng, dễ hiểu: hiển thị đúng số lượng còn trong kho, bấm chọn mã giảm giá 1 chạm và giao hàng nhanh tận tay.
              </p>
              <div style={{ fontSize: '13px', display: 'grid', gap: '4px', color: '#e4e4e7' }}>
                <span>📍 {settings.address || 'Tầng 12, Tòa nhà Bitexco, Quận 1'}, {settings.city || 'TP. Hồ Chí Minh'}</span>
                <span>✉️ {settings.supportEmail || 'support@veylix.vn'}</span>
                <span>📞 {settings.supportPhone || '+84 28 3822 1234'}</span>
              </div>
            </div>

            <div>
              <h4>Danh mục mua sắm</h4>
              <div className="sf-footer-links">
                {(homeData.categories || []).slice(0, 5).map((cat) => (
                  <Link
                    key={cat.id || cat.slug || cat.name}
                    to={`/store/products?category=${encodeURIComponent(cat.name)}`}
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link to="/store/products">Xem tất cả sản phẩm →</Link>
              </div>
            </div>

            <div>
              <h4>Hỗ trợ người mua</h4>
              <div className="sf-footer-links">
                <Link to="/store/orders">Tra cứu & Theo dõi đơn hàng</Link>
                <Link to="/store/deals">Lấy mã giảm giá (Voucher)</Link>
                <Link to="/store/account">Tài khoản & Món yêu thích</Link>
                <Link to="/store/support">Câu hỏi thường gặp & Liên hệ</Link>
                <Link to="/overview">Trang Quản trị Cửa hàng</Link>
              </div>
            </div>

            <div>
              <h4>Nhận mã giảm giá 10% qua Email</h4>
              <p style={{ fontSize: '13.5px', color: '#d4d4d8' }}>
                Điền email để nhận thông báo đợt hàng mới và mã giảm giá độc quyền cho thành viên.
              </p>
              <form className="sf-newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  required
                  placeholder="Nhập email của bạn..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button type="submit" className="sf-btn sf-btn-amber sf-btn-sm" disabled={newsletterBusy}>
                  {newsletterBusy ? 'Đang gửi...' : 'Nhận ưu đãi'}
                </button>
              </form>
            </div>
          </div>

          <div className="sf-footer-bottom">
            <span>© 2026 {settings.storeName || 'Veylix Studio'}. Mua sắm an toàn, minh bạch 100%.</span>
            <span>Hỗ trợ COD nhận hàng trả tiền · VNPay QR · MoMo · Thẻ Visa/Mastercard</span>
          </div>
        </div>
      </footer>

      {/* Global Overlays */}
      <CartDrawer />
      <QuickViewModal />
      <ThemePersonalizerModal />
      {enableLiveChat && <LiveChatWidget />}

      {toasts.length > 0 && (
        <div className="sf-toast-stack" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`sf-toast ${t.type === 'error' ? 'is-error' : ''}`}>
              <SfIcon name={t.type === 'error' ? 'close' : 'check'} size={16} />
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
