import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SfIcon } from '../../components/storefront/StoreIcons';
import { useStore } from '../../components/storefront/StoreContext';
import ProductCard from '../../components/storefront/ProductCard';
import { ThemePersonalizerSection } from '../../components/storefront/ThemePersonalizerModal';
import { storeApi, formatMoney } from '../../components/storefront/storeApi';

const DEMO_ACCOUNTS = [
  { name: 'Sarah Kim', email: 'sarah.kim@example.com', badge: 'Khách VIP' },
  { name: 'Michael Tân', email: 'michael.tan@example.com', badge: 'Khách quen' },
  { name: 'Emily Davis', email: 'emily.davis@example.com', badge: 'Khách quen' },
];

export default function StoreAccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    customer,
    loginCustomer,
    registerCustomer,
    logoutCustomer,
    wishlist,
    showToast,
    refreshHome,
  } = useStore();

  const [authMode, setAuthMode] = useState('login');
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab');
    if (t === 'wishlist' || t === 'appearance') return t;
    return 'orders';
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: 'TP. Hồ Chí Minh, Việt Nam',
  });
  const [authBusy, setAuthBusy] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const qTab = searchParams.get('tab');
    if (qTab === 'wishlist' || qTab === 'orders' || qTab === 'appearance') {
      setActiveTab(qTab);
    }
  }, [searchParams]);

  const loadCustomerOrders = useCallback(async () => {
    if (!customer?.email) {
      setOrders([]);
      return;
    }
    try {
      setOrdersLoading(true);
      const list = await storeApi.getCustomerOrders(customer.email);
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [customer?.email]);

  useEffect(() => {
    loadCustomerOrders();
  }, [loadCustomerOrders]);

  const handleLogin = async (emailToUse) => {
    const target = String(emailToUse ?? loginEmail).trim();
    if (!target || authBusy) return;
    try {
      setAuthBusy(true);
      await loginCustomer(target);
      setActiveTab('orders');
    } catch (err) {
      showToast(err.message || 'Chưa có email này, bạn hãy bấm tab Đăng ký khách hàng mới nhé!', 'error');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.email.trim() || authBusy) return;
    try {
      setAuthBusy(true);
      await registerCustomer({
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        location: regForm.location.trim(),
      });
      setActiveTab('orders');
    } catch (err) {
      showToast(err.message || 'Đăng ký tài khoản thất bại', 'error');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelTarget || cancelling) return;
    const code = cancelTarget.orderCode || cancelTarget.id;
    try {
      setCancelling(true);
      await storeApi.cancelOrder(code, 'Khách hủy từ trang Tài khoản');
      setCancelTarget(null);
      showToast(`Đã hủy đơn #${code} thành công`);
      loadCustomerOrders();
      refreshHome();
    } catch (err) {
      showToast(err.message || 'Không thể hủy đơn hàng này', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="sf-container">
      <div style={{ marginTop: '28px' }}>
        <span className="sf-eyebrow">Không gian cá nhân của bạn</span>
        <h1 className="sf-section-title">Tài khoản, Đơn hàng & Cá nhân hóa Giao diện</h1>
      </div>

      {/* Auth Section when not signed in */}
      {!customer ? (
        <section className="sf-checkout-grid" style={{ marginTop: '22px' }}>
          <div className="sf-card">
            <div className="sf-tabs" style={{ marginBottom: '20px' }}>
              <button
                type="button"
                className={`sf-tab ${authMode === 'login' ? 'is-active' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                Đăng nhập nhanh
              </button>
              <button
                type="button"
                className={`sf-tab ${authMode === 'register' ? 'is-active' : ''}`}
                onClick={() => setAuthMode('register')}
              >
                Đăng ký khách hàng mới
              </button>
            </div>

            {authMode === 'login' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin(loginEmail);
                }}
                style={{ display: 'grid', gap: '14px' }}
              >
                <p style={{ fontSize: '14px', color: 'var(--sf-text-muted)' }}>
                  Chỉ cần nhập địa chỉ email đặt hàng của bạn để xem toàn bộ lịch sử đơn mua và tự điền địa chỉ khi thanh toán.
                </p>
                <div className="sf-field">
                  <label htmlFor="sf-acc-email">Email khách hàng *</label>
                  <input
                    id="sf-acc-email"
                    type="email"
                    className="sf-input"
                    placeholder="sarah.kim@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="sf-btn sf-btn-primary" disabled={authBusy}>
                  {authBusy ? 'Đang đăng nhập...' : 'Vào Tài khoản của tôi'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} style={{ display: 'grid', gap: '14px' }}>
                <div className="sf-form-grid">
                  <div className="sf-field">
                    <label htmlFor="sf-reg-name">Họ và tên *</label>
                    <input
                      id="sf-reg-name"
                      className="sf-input"
                      placeholder="Lê Minh Thư"
                      value={regForm.name}
                      onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="sf-field">
                    <label htmlFor="sf-reg-phone">Số điện thoại</label>
                    <input
                      id="sf-reg-phone"
                      className="sf-input"
                      placeholder="0909 123 456"
                      value={regForm.phone}
                      onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <div className="sf-field sf-field-full">
                    <label htmlFor="sf-reg-email">Địa chỉ Email *</label>
                    <input
                      id="sf-reg-email"
                      type="email"
                      className="sf-input"
                      placeholder="minhthu@example.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="sf-field sf-field-full">
                    <label htmlFor="sf-reg-loc">Địa chỉ giao hàng mặc định</label>
                    <input
                      id="sf-reg-loc"
                      className="sf-input"
                      placeholder="Quận 1, TP. Hồ Chí Minh"
                      value={regForm.location}
                      onChange={(e) => setRegForm((f) => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                </div>
                <button type="submit" className="sf-btn sf-btn-primary" disabled={authBusy}>
                  {authBusy ? 'Đang tạo tài khoản...' : 'Tạo tài khoản mới'}
                </button>
              </form>
            )}
          </div>

          {/* Demo One-Click Customer Accounts */}
          <div className="sf-card">
            <h2>⚡ Dùng thử 1 chạm (Tài khoản mẫu có sẵn)</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--sf-text-muted)', marginBottom: '16px' }}>
              Bấm chọn 1 trong 3 khách hàng mẫu dưới đây để đăng nhập ngay lập tức và xem các đơn hàng thật trong hệ thống:
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  className="sf-radio-card"
                  disabled={authBusy}
                  onClick={() => handleLogin(acc.email)}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '14.5px' }}>{acc.name}</strong>
                    <small style={{ color: 'var(--sf-text-muted)', fontSize: '12.5px' }}>{acc.email}</small>
                  </div>
                  <span className="sf-pill sf-pill-amber">{acc.badge} →</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        /* Signed-in Member Profile Header */
        <section className="sf-card" style={{ marginTop: '22px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  background: 'var(--sf-primary)',
                  color: 'var(--sf-on-primary)',
                  border: 'var(--sf-btn-border)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '20px',
                  fontWeight: 900,
                }}
              >
                {customer.avatar || customer.name?.charAt(0) || 'V'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '22px', marginBottom: 0 }}>{customer.name}</h2>
                  <span className="sf-pill sf-pill-amber">{customer.segment || 'Khách thành viên'}</span>
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--sf-text-muted)', marginTop: '4px' }}>
                  {customer.email} {customer.phone ? `· ${customer.phone}` : ''} {customer.location ? `· ${customer.location}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <small style={{ display: 'block', fontSize: '12px', color: 'var(--sf-text-muted)' }}>
                  Tổng chi tiêu tích lũy
                </small>
                <strong style={{ fontSize: '20px', fontWeight: 900, color: 'var(--sf-primary)' }}>
                  {formatMoney(customer.totalSpent || 0)}
                </strong>
              </div>
              <button type="button" className="sf-btn sf-btn-outline sf-btn-sm" onClick={logoutCustomer}>
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1.5px dashed var(--sf-border-subtle)' }}>
            <div className="sf-tabs">
              <button
                type="button"
                className={`sf-tab ${activeTab === 'orders' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('orders');
                  setSearchParams({ tab: 'orders' }, { replace: true });
                }}
              >
                📦 Lịch sử Đơn hàng ({orders.length})
              </button>
              <button
                type="button"
                className={`sf-tab ${activeTab === 'wishlist' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('wishlist');
                  setSearchParams({ tab: 'wishlist' }, { replace: true });
                }}
              >
                ❤️ Món Yêu thích ({wishlist.length})
              </button>
              <button
                type="button"
                className={`sf-tab ${activeTab === 'appearance' ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveTab('appearance');
                  setSearchParams({ tab: 'appearance' }, { replace: true });
                }}
              >
                🎨 Giao diện & Màu sắc
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Orders List for Signed-in Customer */}
      {customer && activeTab === 'orders' && (
        <section style={{ marginTop: '22px', display: 'grid', gap: '14px' }}>
          {ordersLoading ? (
            <div className="sf-card" style={{ textAlign: 'center', padding: '40px' }}>
              Đang tải danh sách đơn hàng của bạn...
            </div>
          ) : orders.length === 0 ? (
            <div className="sf-card" style={{ textAlign: 'center', padding: '44px 20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>
                Tài khoản chưa có đơn hàng nào
              </h3>
              <p style={{ color: 'var(--sf-text-muted)', marginBottom: '18px' }}>
                Hãy khám phá kệ hàng để đặt đơn đầu tiên và áp dụng Voucher giảm giá nhé!
              </p>
              <Link to="/store/products" className="sf-btn sf-btn-primary">
                Mua sắm ngay
              </Link>
            </div>
          ) : (
            orders.map((ord) => {
              const code = ord.orderCode || ord.id;
              return (
                <article
                  key={code}
                  className="sf-card"
                  style={{
                    marginTop: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '17px', fontWeight: 900 }}>#{code}</strong>
                      <span
                        className={`sf-pill ${
                          ord.fulfillmentStatus === 'Delivered'
                            ? 'sf-pill-success'
                            : ord.fulfillmentStatus === 'Cancelled'
                            ? 'sf-pill-danger'
                            : 'sf-pill-amber'
                        }`}
                      >
                        {ord.fulfillmentStatus}
                      </span>
                      <span style={{ fontSize: '12.5px', color: 'var(--sf-text-muted)' }}>
                        Ngày đặt: {ord.date}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--sf-text-muted)', marginTop: '6px' }}>
                      {ord.itemsDesc || `${ord.itemsCount || 1} sản phẩm`} · Giao tới: {ord.address || '—'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '18px', fontWeight: 900, color: 'var(--sf-primary)', marginRight: '6px' }}>
                      {formatMoney(ord.total)}
                    </strong>
                    <Link
                      to={`/store/orders?code=${encodeURIComponent(code)}`}
                      className="sf-btn sf-btn-outline sf-btn-sm"
                    >
                      Theo dõi 4 chặng
                    </Link>
                    {ord.fulfillmentStatus === 'Processing' && (
                      <button
                        type="button"
                        className="sf-btn sf-btn-danger sf-btn-sm"
                        onClick={() => setCancelTarget(ord)}
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {/* Wishlist Section */}
      {(!customer || activeTab === 'wishlist') && (
        <section className="sf-section" style={{ marginTop: '32px' }}>
          <div className="sf-section-head">
            <div>
              <span className="sf-eyebrow">Món đồ bạn đã thả tim</span>
              <h2 className="sf-section-title">Danh sách Yêu thích ({wishlist.length})</h2>
            </div>
          </div>

          {wishlist.length === 0 ? (
            <div className="sf-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--sf-text-muted)', marginBottom: '16px' }}>
                Bạn chưa lưu sản phẩm yêu thích nào. Hãy nhấn biểu tượng trái tim trên sản phẩm để lưu lại nhé!
              </p>
              <Link to="/store/products" className="sf-btn sf-btn-outline">
                Xem kệ hàng sản phẩm
              </Link>
            </div>
          ) : (
            <div className="sf-products-grid">
              {wishlist.map((item) => (
                <ProductCard key={item.sku || item.id} product={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Personalizer Block inside Account Page */}
      {(!customer || activeTab === 'appearance') && (
        <section className="sf-section" style={{ marginTop: '32px' }}>
          <div className="sf-card">
            <span className="sf-eyebrow">Cá nhân hóa trải nghiệm mua sắm</span>
            <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>
              🎨 Tùy chỉnh Giao diện & Màu sắc của bạn
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--sf-text-muted)', marginBottom: '20px' }}>
              Chọn giữa 4 phong cách mềm mại tinh tế (<strong>Veylix Kem Ấm, Thủy Tinh Mờ, Kính Lỏng Hiện Đại, Tối Giản</strong>) và 6 bảng màu hài hòa:
            </p>
            <ThemePersonalizerSection />
          </div>
        </section>
      )}

      {/* Cancel Order Modal */}
      {cancelTarget && (
        <div
          className="sf-backdrop sf-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelTarget(null);
          }}
        >
          <div className="sf-modal-card sf-modal-sm">
            <h3 style={{ fontSize: '19px', fontWeight: 900, marginBottom: '8px' }}>
              Hủy đơn hàng #{cancelTarget.orderCode || cancelTarget.id}?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--sf-text-muted)', marginBottom: '20px' }}>
              Đơn hàng sẽ được hủy ngay và hoàn lại tồn kho cho các sản phẩm trong đơn.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="sf-btn sf-btn-outline"
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                Đóng
              </button>
              <button
                type="button"
                className="sf-btn sf-btn-danger"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
